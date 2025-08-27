
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UpdateRequest } from '@/lib/types';

const safeDateToISO = (date: any): string => {
    if (!date) return new Date().toISOString(); // Fallback to now
    if (typeof date.toDate === 'function') { // Firestore Timestamp
        return date.toDate().toISOString();
    }
    if (typeof date === 'string') { // ISO string
        return date;
    }
    if (date instanceof Date) { // JS Date object
        return date.toISOString();
    }
    return new Date().toISOString();
};


export function useRequests() {
  const [requests, setRequests] = useState<UpdateRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'update-requests'));
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      setLoading(true);
      const requestsDataPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        let photoUrl = '';

        // Fetch the member's photoUrl using the memberId
        if (data.memberId) {
            const memberRef = doc(db, 'members', data.memberId);
            const memberSnap = await getDoc(memberRef);
            if (memberSnap.exists()) {
                photoUrl = memberSnap.data().photoUrl || '';
            }
        }

        return {
            ...data,
            id: docSnapshot.id,
            requestDate: safeDateToISO(data.requestDate),
            memberPhotoUrl: photoUrl,
        } as UpdateRequest;
      });

      const requestsData = await Promise.all(requestsDataPromises);
      setRequests(requestsData.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()));
      setLoading(false);
    }, (error) => {
        console.error("Error fetching update requests: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { requests, loading };
}
