
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ShieldCheck, Bell, ArrowUpRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { MembersTable } from '@/components/members-table';
import { useMembers } from '@/hooks/use-members';
import { useRequests } from '@/hooks/use-requests';
import { getMemberStatus } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusDistributionChart } from '@/components/charts/status-distribution-chart';
import { BloodGroupDistributionChart } from '@/components/charts/blood-group-distribution-chart';


export default function DashboardPage() {
  const { members, loading: membersLoading } = useMembers();
  const { requests, loading: requestsLoading } = useRequests();

  if (membersLoading || requestsLoading) {
    return (
       <div className="flex flex-col gap-8 py-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <Card><CardHeader><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-12" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-4 w-32" /></CardHeader><CardContent><Skeleton className="h-8 w-12" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-4 w-28" /></CardHeader><CardContent><Skeleton className="h-8 w-12" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-4 w-20" /></CardHeader><CardContent><Skeleton className="h-8 w-12" /></CardContent></Card>
        </div>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-1 lg:col-span-4 h-[350px]">
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[250px] w-full" />
                </CardContent>
            </Card>
            <Card className="col-span-1 lg:col-span-3 h-[350px]">
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[250px] w-full" />
                </CardContent>
            </Card>
        </div>
        <div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-72" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
    )
  }

  const totalMembers = members.length;
  const activeMembers = members.filter(m => getMemberStatus(m) === 'Active').length;
  const expiredCertificates = members.filter(m => getMemberStatus(m) === 'Expired').length;
  const pendingRequests = requests.length;

  return (
    <div className="flex flex-col gap-8 py-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              {activeMembers} active members
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Expired Certificates
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{expiredCertificates}</div>
            <p className="text-xs text-muted-foreground">
              Require renewal
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Update Requests</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Pending approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              New Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+5</div>
            <p className="text-xs text-muted-foreground">
              in the last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Blood Group Distribution</CardTitle>
            <CardDescription>A breakdown of member blood types across the association.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
             <BloodGroupDistributionChart members={members} />
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Membership Status</CardTitle>
             <CardDescription>An overview of the current status of all members.</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDistributionChart members={members} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
