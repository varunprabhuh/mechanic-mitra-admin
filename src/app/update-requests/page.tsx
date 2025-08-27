
'use client';

import { UpdateRequestsTable } from '@/components/update-requests-table';
import { useRequests } from '@/hooks/use-requests';
import { Skeleton } from '@/components/ui/skeleton';
import { BellOff } from 'lucide-react';

export default function UpdateRequestsPage() {
  const { requests, loading } = useRequests();

  const renderContent = () => {
    if (loading) {
      return (
        <div className="rounded-lg border">
          <div className="p-4 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      );
    }

    if (requests.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-16">
          <BellOff className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">No Pending Requests</h2>
          <p className="text-muted-foreground">
            There are no outstanding profile update requests from members.
          </p>
        </div>
      );
    }
    
    return <UpdateRequestsTable requests={requests} />;
  }
  
  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Update Requests</h1>
          <p className="text-muted-foreground">
            Review and process profile update requests from members.
          </p>
        </div>
      </div>
      {renderContent()}
    </div>
  );
}
