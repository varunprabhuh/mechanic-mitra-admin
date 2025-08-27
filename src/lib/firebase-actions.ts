
'use server';

import 'dotenv/config';
import { db } from './firebase';
import { collection, doc, updateDoc, deleteDoc, writeBatch, getDoc, getDocs, query, orderBy, limit, setDoc, where, addDoc, startAfter } from 'firebase/firestore';
import type { Member, UpdateRequest, AdminProfile, CertificateLayout, IdCardLayout } from './types';
import { getAdminApp } from './firebase/admin';


async function getNextMemberId(): Promise<string> {
    const membersRef = collection(db, 'members');
    const q = query(membersRef, orderBy('id', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return 'MM001';
    }

    const lastMemberId = querySnapshot.docs[0].id;
    const lastNumber = parseInt(lastMemberId.replace('MM', ''), 10);
    const nextNumber = lastNumber + 1;
    return `MM${String(nextNumber).padStart(3, '0')}`;
}

async function handleDocumentUploads(documents: Record<string, string | File>): Promise<Record<string, string>> {
    const uploadedDocUrls: Record<string, string> = {};
    for (const key in documents) {
        const docValue = documents[key];
        // Check if it's a data URI (a base64 encoded string from a File object)
        if (typeof docValue === 'string' && docValue.startsWith('data:')) {
            uploadedDocUrls[key] = docValue;
        } else if (typeof docValue === 'string') {
             // It's already a URL, so keep it.
            uploadedDocUrls[key] = docValue;
        }
    }
    return uploadedDocUrls;
}

export type AddMemberPayload = Omit<Member, 'id' | 'certificate' | 'email' | 'status' | 'dob'> & {
    dob: string; // Expect ISO string from client
    documents?: Record<string, string | File>;
};

// Member Actions
export async function addMember(memberPayload: AddMemberPayload) {
  // Initialize Admin SDK first to catch initialization errors separately.
  const admin = getAdminApp();
  
  const newMemberId = await getNextMemberId(); // Generate ID early for rollback if needed
  let authUserCreated = false;

  try {
    // Check for duplicate mobile number
    const membersRef = collection(db, 'members');
    const q = query(membersRef, where("mobile", "==", memberPayload.mobile));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      throw new Error('A member with this mobile number already exists.');
    }

    const memberEmail = `${newMemberId.toLowerCase()}@mechanicmitra.in`;
    const defaultPassword = 'mechanicmitra';

    try {
        const authPayload = {
            uid: newMemberId,
            email: memberEmail,
            password: defaultPassword,
        };
        await admin.auth().createUser(authPayload);
        authUserCreated = true;
        
        // Add display name in a separate update call for robustness
        await admin.auth().updateUser(newMemberId, {
            displayName: memberPayload.name,
        });

    } catch (authError) {
        console.error("Firebase Auth Error:", authError);
        throw new Error('Failed to create authentication account for the member. This might be due to server configuration issues or invalid data.');
    }

    // 3. Create Firestore document
    const memberRef = doc(db, 'members', newMemberId);
    const photoUrl = memberPayload.photoUrl;
    const documentUrls = memberPayload.documents
      ? await handleDocumentUploads(memberPayload.documents)
      : {};

    const newMemberData = {
      ...memberPayload,
      dob: new Date(memberPayload.dob), // Pass the JS Date object directly
      id: newMemberId,
      email: memberEmail,
      certificate: null,
      status: 'active',
      photoUrl,
      documents: documentUrls,
    };

    await setDoc(memberRef, newMemberData);

  } catch (error: any) {
    // If Auth user was created but something else failed, roll back Auth user.
    if (authUserCreated) {
      try {
        await admin.auth().deleteUser(newMemberId);
        console.log(`Rolled back and deleted auth user: ${newMemberId}`);
      } catch (rollbackError) {
        console.error(`Failed to rollback auth user ${newMemberId}:`, rollbackError);
      }
    }
    
    // Re-throw the original error to be displayed to the user
    throw error;
  }
}

export async function updateMember(memberId: string, memberData: Partial<Omit<Member, 'dob'>> & { dob?: string }) {
  const memberRef = doc(db, 'members', memberId);
  const memberSnap = await getDoc(memberRef);
  if (!memberSnap.exists()) {
    throw new Error("Member not found");
  }
  const existingData = memberSnap.data();
  const updateData: Record<string, any> = { ...memberData };


  // Photo is already a data URL if a new one was uploaded
  if (updateData.photoUrl) {
    updateData.photoUrl = updateData.photoUrl;
  }
  
  if (updateData.documents) {
     const newDocumentUrls = await handleDocumentUploads(updateData.documents);
     updateData.documents = { ...(existingData.documents || {}), ...newDocumentUrls };
  }

  if (updateData.dob && typeof updateData.dob === 'string') {
    // Convert incoming ISO string to a standard Date object
    updateData.dob = new Date(updateData.dob);
  }

  await updateDoc(memberRef, updateData);

  // Also update the auth user if name or photo changes
  const admin = getAdminApp();
  const authUpdatePayload: { displayName?: string, photoURL?: string } = {};
  if (memberData.name) authUpdatePayload.displayName = memberData.name;
  
  // Only update photoURL if it's a standard URL, not a data URI
  if (memberData.photoUrl && memberData.photoUrl.startsWith('https://')) {
      authUpdatePayload.photoURL = memberData.photoUrl;
  }

  if (Object.keys(authUpdatePayload).length > 0) {
      try {
        await admin.auth().updateUser(memberId, authUpdatePayload);
      } catch (error) {
        console.warn(`Could not update auth user for ${memberId}, it might not exist.`, error);
      }
  }
}

export async function setMemberStatus(memberId: string, status: 'active' | 'inactive') {
  const memberRef = doc(db, 'members', memberId);
  await updateDoc(memberRef, { status: status });
}

export async function setMembersStatus(memberIds: string[], status: 'active' | 'inactive') {
  const batch = writeBatch(db);
  
  memberIds.forEach((id) => {
    const memberRef = doc(db, 'members', id);
    batch.update(memberRef, { status: status });
  });

  await batch.commit();
}

export async function deleteMember(memberId: string) {
  const admin = getAdminApp();
  const memberRef = doc(db, 'members', memberId);
  await deleteDoc(memberRef);
  try {
    await admin.auth().deleteUser(memberId);
  } catch (error: any) {
     if (error.code === 'auth/user-not-found') {
        console.log(`Auth user for ${memberId} not found, skipping deletion.`);
     } else {
        throw error;
     }
  }
}

export async function deleteMembers(memberIds: string[]) {
  const admin = getAdminApp();
  const batch = writeBatch(db);
  memberIds.forEach((id) => {
    const memberRef = doc(db, 'members', id);
    batch.delete(memberRef);
  });
  
  try {
    await admin.auth().deleteUsers(memberIds);
  } catch (error: any) {
    if (error instanceof Error) {
        console.log(`Some auth users might not have been found during bulk deletion, which is acceptable.`);
    }
  }

  await batch.commit();
}

export async function renewCertificate(memberId: string) {
  const memberRef = doc(db, 'members', memberId);
  const memberSnap = await getDoc(memberRef);
  if (!memberSnap.exists() || !memberSnap.data().certificate) {
     return generateCertificate(memberId);
  }
  
  const existingCertificate = memberSnap.data().certificate;
  const issuedDate = new Date();
  
  // Expiry is always next year's May 31st
  const expiryYear = issuedDate.getFullYear() + 1;
  const expiryDate = new Date(expiryYear, 4, 31); // Month is 0-indexed, so 4 is May
  
  const renewedCertificate = {
    ...existingCertificate,
    issuedDate: issuedDate,
    expiryDate: expiryDate,
  };

  await updateDoc(memberRef, {
    certificate: renewedCertificate
  });
}

export async function generateCertificate(memberId: string): Promise<Member['certificate']> {
  const memberRef = doc(db, 'members', memberId);
  const issuedDate = new Date();
  
  // Expiry is always next year's May 31st
  const expiryYear = issuedDate.getFullYear() + 1;
  const expiryDate = new Date(expiryYear, 4, 31); // Month is 0-indexed, so 4 is May

  const newCertificate = {
    id: `CERT${String(Date.now()).slice(-6)}`,
    issuedDate: issuedDate,
    expiryDate: expiryDate,
  };

  await updateDoc(memberRef, {
    certificate: newCertificate,
  });

  // Firestore returns Timestamps, so for immediate use we convert to ISO strings
  return {
    ...newCertificate,
    issuedDate: issuedDate.toISOString(),
    expiryDate: expiryDate.toISOString(),
  };
}


// Update Request Actions
export async function createUpdateRequest(requestData: Omit<UpdateRequest, 'id' | 'requestDate' | 'status'> & { memberPhotoUrl?: string }) {
    const requestsRef = collection(db, 'update-requests');
    const newRequest: Omit<UpdateRequest, 'id'> = {
        ...requestData,
        requestDate: new Date().toISOString(),
        status: 'Pending'
    };
    await addDoc(requestsRef, newRequest);
}


export async function approveRequest(request: UpdateRequest) {
  const batch = writeBatch(db);

  // 1. Update the member document
  const memberRef = doc(db, 'members', request.memberId);
  batch.update(memberRef, { [request.field]: request.newValue });

  // 2. Delete the request document
  const requestRef = doc(db, 'update-requests', request.id);
  batch.delete(requestRef);

  await batch.commit();

  // 3. Create a notification for the member
  const notificationsRef = collection(db, 'notifications');
  await addDoc(notificationsRef, {
    memberId: request.memberId,
    message: `Your request to update '${request.field}' has been approved.`,
    type: 'request_approved',
    createdAt: new Date(),
    isRead: false,
    relatedId: request.id,
  });
}

export async function rejectRequest(request: UpdateRequest) {
  // 1. Delete the request document
  const requestRef = doc(db, 'update-requests', request.id);
  await deleteDoc(requestRef);

  // 2. Create a notification for the member
  const notificationsRef = collection(db, 'notifications');
  await addDoc(notificationsRef, {
    memberId: request.memberId,
    message: `Your request to update '${request.field}' was rejected. Contact the Mechanic Mitra Members Association Admin for more details.`,
    type: 'request_rejected',
    createdAt: new Date(),
    isRead: false,
    relatedId: request.id,
  });
}

// Notification Actions
export async function sendCertificateReminder(memberId: string) {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
        memberId: memberId,
        message: 'Your membership certificate is expiring soon. Please contact the admin to renew it.',
        type: 'certificate_reminder',
        createdAt: new Date(),
        isRead: false,
    });
}

export async function sendBulkNotifications(memberIds: string[], message: string) {
    const batch = writeBatch(db);
    const notificationsRef = collection(db, 'notifications');

    memberIds.forEach(memberId => {
        const newNotifRef = doc(notificationsRef); // Create a new doc ref with auto-ID
        batch.set(newNotifRef, {
            memberId: memberId,
            message: message,
            type: 'broadcast',
            createdAt: new Date(),
            isRead: false,
        });
    });

    await batch.commit();
}


// Admin Profile Actions
export async function getAdminProfile(uid: string): Promise<AdminProfile | null> {
    const profileRef = doc(db, 'admins', uid);
    const docSnap = await getDoc(profileRef);
    if (docSnap.exists()) {
        return { uid: docSnap.id, ...docSnap.data() } as AdminProfile;
    }
    return null;
}

export async function updateAdminProfile(uid: string, profileData: Partial<Omit<AdminProfile, 'uid'>>) {
    const profileRef = doc(db, 'admins', uid);
    await setDoc(profileRef, profileData, { merge: true });
}

// Certificate Layout Actions
export async function getCertificateLayout(): Promise<CertificateLayout | null> {
    const layoutRef = doc(db, 'settings', 'certificateLayout');
    const docSnap = await getDoc(layoutRef);
    if (docSnap.exists()) {
        return docSnap.data().positions as CertificateLayout;
    }
    return null;
}

export async function saveCertificateLayout(positions: CertificateLayout) {
    const layoutRef = doc(db, 'settings', 'certificateLayout');
    await setDoc(layoutRef, { positions });
}

// ID Card Layout Actions
export async function getIdCardLayout(): Promise<IdCardLayout | null> {
    const layoutRef = doc(db, 'settings', 'idCardLayout');
    const docSnap = await getDoc(layoutRef);
    if (docSnap.exists()) {
        return docSnap.data().positions as IdCardLayout;
    }
    return null;
}

export async function saveIdCardLayout(positions: IdCardLayout) {
    const layoutRef = doc(db, 'settings', 'idCardLayout');
    await setDoc(layoutRef, { positions });
}

export async function markNotificationsAsRead(memberId: string) {
    const q = query(
        collection(db, 'notifications'),
        where('memberId', '==', memberId),
        where('isRead', '==', false)
    );
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
    });
    await batch.commit();
}

export async function deleteNotification(notificationId: string) {
    const notificationRef = doc(db, 'notifications', notificationId);
    await deleteDoc(notificationRef);
}

export async function deleteAllNotifications(memberId: string) {
    const q = query(
        collection(db, 'notifications'),
        where('memberId', '==', memberId)
    );
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}
