import { create } from 'zustand';
import type { Member } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, limit, startAfter, getDocs, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { setMemberStatus as setDbMemberStatus, deleteMember as deleteDbMember, deleteMembers as deleteDbMembers, setMembersStatus as setDbMembersStatus, renewCertificate } from '@/lib/firebase-actions';
import { toast } from '@/hooks/use-toast';

const PAGE_SIZE = 25;

interface MemberState {
  members: Member[];
  loading: boolean;
  hasMore: boolean;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  isFetchingMore: boolean;
  isInitialized: boolean;
  processingIds: Set<string>;
  init: () => void;
  fetchMoreMembers: () => Promise<void>;
  getMemberById: (id: string) => Member | undefined;
  setMemberStatus: (memberId: string, memberName: string, status: 'active' | 'inactive') => Promise<void>;
  setMembersStatus: (memberIds: string[], status: 'active' | 'inactive') => Promise<void>;
  deleteMember: (memberId: string, memberName: string) => Promise<void>;
  deleteMembers: (memberIds: string[]) => Promise<void>;
  renewMemberCertificate: (memberId: string, memberName: string) => Promise<void>;
}

const processDocs = (querySnapshot: any): Member[] => {
    const membersData: Member[] = [];
    querySnapshot.forEach((doc: any) => {
      const data = doc.data();
      const member: Partial<Member> = {
          ...data,
          id: doc.id,
      };

      if (data.certificate && data.certificate.issuedDate?.toDate && data.certificate.expiryDate?.toDate) {
          member.certificate = {
              id: data.certificate.id,
              issuedDate: data.certificate.issuedDate.toDate().toISOString(),
              expiryDate: data.certificate.expiryDate.toDate().toISOString(),
          };
      } else {
          member.certificate = null;
      }

      if (data.dob?.toDate) {
          member.dob = data.dob.toDate().toISOString();
      }

      membersData.push(member as Member);
    });
    return membersData;
}


export const useMemberStore = create<MemberState>((set, get) => ({
  members: [],
  loading: true,
  hasMore: true,
  lastDoc: null,
  isFetchingMore: false,
  isInitialized: false,
  processingIds: new Set(),
  init: () => {
    if (get().isInitialized) return; 

    set({ isInitialized: true, loading: true });

    const initialQuery = query(collection(db, 'members'), orderBy('id'), limit(PAGE_SIZE));

    const unsubscribe = onSnapshot(initialQuery, (querySnapshot) => {
      const membersData = processDocs(querySnapshot);
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      set({
        members: membersData,
        lastDoc: lastVisible,
        hasMore: querySnapshot.docs.length === PAGE_SIZE,
        loading: false,
      });
    }, (error) => {
        console.error("Error fetching members: ", error);
        set({ loading: false });
    });
    
    // We don't store the listener anymore as it's a one-time setup
  },
  fetchMoreMembers: async () => {
    const { isFetchingMore, hasMore, lastDoc } = get();
    if (isFetchingMore || !hasMore || !lastDoc) return;

    set({ isFetchingMore: true });

    const nextQuery = query(
      collection(db, 'members'),
      orderBy('id'),
      startAfter(lastDoc),
      limit(PAGE_SIZE)
    );

    try {
        const documentSnapshots = await getDocs(nextQuery);
        const newMembers = processDocs(documentSnapshots);
        const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];

        set(state => ({
            members: [...state.members, ...newMembers],
            lastDoc: lastVisible,
            hasMore: documentSnapshots.docs.length === PAGE_SIZE,
        }));
    } catch (error) {
        console.error("Error fetching more members:", error);
    } finally {
        set({ isFetchingMore: false });
    }
  },
  getMemberById: (id) => {
    return get().members.find(m => m.id === id);
  },
  setMemberStatus: async (memberId, memberName, status) => {
    set(state => ({ processingIds: new Set(state.processingIds).add(memberId) }));

    try {
      await setDbMemberStatus(memberId, status);
      toast({
        title: "Status Updated",
        description: `${memberName} has been set to ${status}.`,
      });
      // The onSnapshot listener will update the local state automatically.
    } catch (e) {
      toast({
        title: "Status Update Failed",
        description: `Could not update ${memberName}'s status. Please try again.`,
        variant: "destructive",
      });
    } finally {
      set(state => {
        const newProcessingIds = new Set(state.processingIds);
        newProcessingIds.delete(memberId);
        return { processingIds: newProcessingIds };
      });
    }
  },
  setMembersStatus: async (memberIds, status) => {
    set(state => ({ processingIds: new Set([...state.processingIds, ...memberIds]) }));
    try {
        await setDbMembersStatus(memberIds, status);
        toast({
          title: "Bulk Status Update Successful",
          description: `${memberIds.length} member(s) have been set to ${status}.`,
        });
      } catch (e) {
        toast({
          title: "Bulk Status Update Failed",
          description: "Could not update member statuses. Please try again.",
          variant: "destructive",
        });
      } finally {
         set(state => {
            const newProcessingIds = new Set(state.processingIds);
            memberIds.forEach(id => newProcessingIds.delete(id));
            return { processingIds: newProcessingIds };
        });
      }
  },
  deleteMember: async (memberId, memberName) => {
    set(state => ({ processingIds: new Set(state.processingIds).add(memberId) }));
    try {
      await deleteDbMember(memberId);
      toast({
        title: "Member Deleted",
        description: `${memberName} has been removed.`,
      });
      // The onSnapshot listener will update the local state automatically.
    } catch (e) {
      toast({
        title: "Deletion Failed",
        description: `Could not delete ${memberName}. Please try again.`,
        variant: 'destructive'
      });
    } finally {
        set(state => {
            const newProcessingIds = new Set(state.processingIds);
            newProcessingIds.delete(memberId);
            return { processingIds: newProcessingIds };
        });
    }
  },
  deleteMembers: async (memberIds) => {
    set(state => ({ processingIds: new Set([...state.processingIds, ...memberIds]) }));
    try {
      await deleteDbMembers(memberIds);
      toast({
        title: "Members Deleted",
        description: `${memberIds.length} member(s) have been removed.`,
      });
    } catch (e) {
      toast({
        title: "Bulk Deletion Failed",
        description: "Could not delete selected members. Please try again.",
        variant: "destructive",
      });
    } finally {
        set(state => {
            const newProcessingIds = new Set(state.processingIds);
            memberIds.forEach(id => newProcessingIds.delete(id));
            return { processingIds: newProcessingIds };
        });
    }
  },
   renewMemberCertificate: async (memberId, memberName) => {
    set(state => ({ processingIds: new Set(state.processingIds).add(memberId) }));
    try {
        await renewCertificate(memberId);
        toast({
            title: "Certificate Renewed",
            description: `Certificate for ${memberName} has been renewed successfully.`,
        });
    } catch(error) {
        toast({
            title: "Renewal Failed",
            description: `Could not renew certificate. Please try again.`,
            variant: "destructive"
        });
    } finally {
        set(state => {
            const newProcessingIds = new Set(state.processingIds);
            newProcessingIds.delete(memberId);
            return { processingIds: newProcessingIds };
        });
    }
  }
}));

// Initialize the store and its listener when the app loads
if (typeof window !== 'undefined') {
    useMemberStore.getState().init();
}

    