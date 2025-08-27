
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import type { UpdateRequest } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { approveRequest, rejectRequest } from '@/lib/firebase-actions';

export function UpdateRequestsTable({ requests }: { requests: UpdateRequest[] }) {
  const { toast } = useToast();
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const handleRequest = async (request: UpdateRequest, action: 'approve' | 'reject') => {
    setProcessingId(request.id);
    try {
        if (action === 'approve') {
            await approveRequest(request);
            toast({
                title: `Request Approved`,
                description: `The update request from ${request.memberName} has been approved.`,
            });
        } else {
            await rejectRequest(request);
            toast({
                title: `Request Rejected`,
                description: `The update request from ${request.memberName} has been rejected.`,
                variant: 'destructive',
            });
        }
    } catch(error) {
        toast({
            title: "Action Failed",
            description: `Could not process the request. Please try again.`,
            variant: 'destructive'
        });
    } finally {
        setProcessingId(null);
    }
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Field</TableHead>
            <TableHead className="hidden md:table-cell">Change Details</TableHead>
            <TableHead className="hidden md:table-cell">Requested</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                     <AvatarImage src={request.memberPhotoUrl} alt={request.memberName} data-ai-hint="person portrait" />
                     <AvatarFallback>{request.memberName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                     <div className="font-medium">{request.memberName}</div>
                     <div className="text-sm text-muted-foreground">{request.memberId}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{request.field}</Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="text-sm text-muted-foreground">From: {request.oldValue}</div>
                <div className="text-sm font-medium">To: {request.newValue}</div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatDistanceToNow(parseISO(request.requestDate), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleRequest(request, 'approve')} disabled={processingId === request.id}>
                        <CheckCircle className="h-4 w-4 mr-2"/>
                        Approve
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleRequest(request, 'reject')} disabled={processingId === request.id}>
                        <XCircle className="h-4 w-4 mr-2"/>
                        Reject
                    </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
