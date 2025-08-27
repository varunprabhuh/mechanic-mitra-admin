
'use client';
import { CertificatesTable } from '@/components/certificates-table';
import { useMembers } from '@/hooks/use-members';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldQuestion, Loader2 } from 'lucide-react';
import React, { useRef, useCallback, useMemo } from 'react';

export default function CertificatesPage() {
  const { members, loading, hasMore, fetchMoreMembers } = useMembers();

  const observer = useRef<IntersectionObserver>();
  const lastMemberElementRef = useCallback((node: HTMLTableRowElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMoreMembers();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, fetchMoreMembers]);


  const membersWithCerts = useMemo(() => {
    return members
      .filter(member => !!member.certificate && !!member.certificate.expiryDate)
      .sort((a, b) => {
        return new Date(a.certificate!.expiryDate).getTime() - new Date(b.certificate!.expiryDate).getTime();
      });
  }, [members]);


  const renderContent = () => {
    if (loading && membersWithCerts.length === 0) {
      return (
         <div className="rounded-lg border">
            <div className="p-4 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
      );
    }
    
    if (membersWithCerts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-16">
                <ShieldQuestion className="h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-semibold">No Certificates Found</h2>
                <p className="text-muted-foreground">
                    No members currently have an active or expired certificate.
                </p>
            </div>
        )
    }

    return <CertificatesTable members={membersWithCerts} lastMemberRef={lastMemberElementRef} />;
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Certificate Management</h1>
          <p className="text-muted-foreground">
            Track and manage all member certificates.
          </p>
        </div>
      </div>
      {renderContent()}
      {hasMore && !loading && (
        <div className="flex justify-center items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
