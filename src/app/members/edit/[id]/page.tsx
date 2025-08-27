
'use client';
import { AddMemberForm } from '@/components/add-member-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMembers } from '@/hooks/use-members';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditMemberPage() {
  const params = useParams();
  const { id } = params;
  const { getMemberById, loading } = useMembers();

  const member = useMemo(() => getMemberById(id as string), [id, getMemberById]);

  if (loading) {
     return (
         <div className="py-8">
            <div className="flex items-center gap-4 mb-8">
                <Skeleton className="h-7 w-7 rounded-full" />
                <div>
                    <Skeleton className="h-9 w-48 mb-2" />
                    <Skeleton className="h-4 w-72" />
                </div>
            </div>
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/members">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-headline">Edit Member</h1>
          <p className="text-muted-foreground">Update the details for {member?.name || 'member'}.</p>
        </div>
      </div>
      {member ? (
        <AddMemberForm initialData={member} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Member Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The member you are trying to edit does not exist.</p>
            <Button asChild className="mt-4">
                <Link href="/members">Go back to Members</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
