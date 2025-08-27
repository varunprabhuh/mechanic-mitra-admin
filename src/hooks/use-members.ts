
'use client';
import { useEffect } from 'react';
import { useMemberStore } from '@/store/member-store';

export function useMembers() {
  const { members, loading, hasMore, fetchMoreMembers, getMemberById, init } = useMemberStore(state => ({
    members: state.members,
    loading: state.loading,
    hasMore: state.hasMore,
    fetchMoreMembers: state.fetchMoreMembers,
    getMemberById: state.getMemberById,
    init: state.init,
  }));
  
  useEffect(() => {
    init();
  }, [init]);

  return { members, loading, getMemberById, hasMore, fetchMoreMembers };
}

    