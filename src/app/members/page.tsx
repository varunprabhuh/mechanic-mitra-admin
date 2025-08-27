
'use client';

import { Button } from '@/components/ui/button';
import { MembersTable } from '@/components/members-table';
import { FilePlus, SearchX, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import React, { useMemo, useCallback, useRef } from 'react';
import { useMembers } from '@/hooks/use-members';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMemberStatus } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function MembersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q');
  const statusFilter = searchParams.get('status');
  const { members, loading, hasMore, fetchMoreMembers } = useMembers();

  const observer = useRef<IntersectionObserver>();
  const lastMemberElementRef = useCallback((node: HTMLTableRowElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !searchQuery) {
        fetchMoreMembers();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, fetchMoreMembers, searchQuery]);


  const filteredMembers = useMemo(() => {
    let filtered = members;

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(
        (member) => getMemberStatus(member).toLowerCase() === statusFilter
      );
    }
    
    // If there's a search query, we filter on the client side.
    // Note: This means search only works on currently loaded members.
    // For a full-scale search, a server-side implementation would be needed.
    if (!searchQuery) {
      return filtered;
    }
    
    const lowercasedQuery = searchQuery.toLowerCase();
    return members.filter( // Search from all loaded members, then filter by status
      (member) =>
        (member.name.toLowerCase().includes(lowercasedQuery) ||
        member.id.toLowerCase().includes(lowercasedQuery) ||
        member.mobile.includes(lowercasedQuery) ||
        member.garageName.toLowerCase().includes(lowercasedQuery))
        && (statusFilter === 'all' || !statusFilter || getMemberStatus(member).toLowerCase() === statusFilter)
    );
  }, [searchQuery, members, statusFilter]);

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      newParams.delete('status');
    } else {
      newParams.set('status', value);
    }
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  };
  
  const currentTab = statusFilter || 'all';

  const renderContent = () => {
    if (loading && members.length === 0) {
       return (
        <div className="rounded-lg border">
            <div className="p-4 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
       )
    }

    if (searchQuery && filteredMembers.length === 0 && !loading) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-16">
                <SearchX className="h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-semibold">No Members Found for "{searchQuery}"</h2>
                <p className="text-muted-foreground">
                    Try searching for something else.
                </p>
                <Button variant="outline" asChild>
                    <Link href="/members">Clear Search</Link>
                </Button>
            </div>
        )
    }

    return <MembersTable members={filteredMembers} lastMemberRef={!searchQuery ? lastMemberElementRef : undefined} />;
  }


  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Members</h1>
          <p className="text-muted-foreground">
            Manage your association members here.
          </p>
        </div>
        <Button asChild>
          <Link href="/members/new">
            <FilePlus className="mr-2 h-4 w-4" />
            Add New Member
          </Link>
        </Button>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>
        <TabsContent value={currentTab} className="mt-4">
            {renderContent()}
            {hasMore && !loading && !searchQuery && (
                <div className="flex justify-center items-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
