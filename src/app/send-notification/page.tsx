
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMembers } from '@/hooks/use-members';
import { MembersTable } from '@/components/members-table';
import { useToast } from '@/hooks/use-toast';
import { sendBulkNotifications } from '@/lib/firebase-actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Send, Users } from 'lucide-react';
import type { Member } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMemberStatus } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';


export default function SendNotificationPage() {
    const { members, loading } = useMembers();
    const [selectedMemberIds, setSelectedMemberIds] = React.useState<string[]>([]);
    const [message, setMessage] = React.useState('');
    const [isSending, setIsSending] = React.useState(false);
    const { toast } = useToast();
    
    const [searchQuery, setSearchQuery] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');

    const handleSendNotification = async () => {
        if (!message.trim()) {
            toast({ title: "Message is empty", description: "Please write a message to send.", variant: "destructive"});
            return;
        }
        if (selectedMemberIds.length === 0) {
            toast({ title: "No members selected", description: "Please select at least one member to notify.", variant: "destructive"});
            return;
        }

        setIsSending(true);
        try {
            await sendBulkNotifications(selectedMemberIds, message);
            toast({
                title: "Notifications Sent",
                description: `Your message has been sent to ${selectedMemberIds.length} member(s).`
            });
            setSelectedMemberIds([]);
            setMessage('');
        } catch (error) {
            toast({
                title: "Failed to Send",
                description: "An error occurred while sending notifications. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSending(false);
        }
    };
    
    const selectedMembers = React.useMemo(() => {
        return members.filter(m => selectedMemberIds.includes(m.id));
    }, [members, selectedMemberIds]);

    const filteredMembers = React.useMemo(() => {
        let filtered = members;

        if (statusFilter && statusFilter !== 'all') {
          filtered = filtered.filter(
            (member) => getMemberStatus(member).toLowerCase() === statusFilter
          );
        }
        
        if (!searchQuery || searchQuery.length < 3) {
          return filtered;
        }
        
        const lowercasedQuery = searchQuery.toLowerCase();
        return filtered.filter(
          (member) =>
            (member.name.toLowerCase().includes(lowercasedQuery) ||
            member.id.toLowerCase().includes(lowercasedQuery) ||
            member.mobile.includes(lowercasedQuery) ||
            member.garageName.toLowerCase().includes(lowercasedQuery))
        );
    }, [searchQuery, members, statusFilter]);
    
    React.useEffect(() => {
        // When filters change, reset selections to avoid sending to unintended recipients
        setSelectedMemberIds([]);
    }, [searchQuery, statusFilter]);


    if (loading && members.length === 0) {
        return (
            <div className="py-8 space-y-8">
                 <Skeleton className="h-9 w-64 mb-2" />
                 <Skeleton className="h-4 w-96" />
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card>
                             <CardHeader>
                                <Skeleton className="h-6 w-48 mb-2" />
                             </CardHeader>
                             <CardContent>
                                <Skeleton className="h-40 w-full" />
                            </CardContent>
                        </Card>
                    </div>
                     <div className="lg:col-span-1 space-y-8">
                         <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-40 mb-2" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-24 w-full" />
                                <Skeleton className="h-10 w-48" />
                            </CardContent>
                         </Card>
                          <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-48 mb-2" />
                            </CardHeader>
                             <CardContent>
                                <Skeleton className="h-24 w-full" />
                            </CardContent>
                         </Card>
                     </div>
                 </div>
            </div>
        )
    }

    return (
        <div className="py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Send Notification</h1>
                    <p className="text-muted-foreground">
                        Broadcast a custom message to selected members.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                             <CardTitle>Select Recipients</CardTitle>
                             <CardDescription>Choose which members should receive the notification.</CardDescription>
                             <div className="pt-4">
                                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex">
                                            <TabsTrigger value="all">All</TabsTrigger>
                                            <TabsTrigger value="active">Active</TabsTrigger>
                                            <TabsTrigger value="inactive">Inactive</TabsTrigger>
                                            <TabsTrigger value="expired">Expired</TabsTrigger>
                                        </TabsList>
                                        <Input
                                            placeholder="Search by name, ID, mobile, etc..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full sm:w-auto flex-1"
                                        />
                                    </div>
                                </Tabs>
                            </div>
                        </CardHeader>
                        <CardContent>
                           <MembersTable 
                                members={filteredMembers}
                                selectedMemberIds={selectedMemberIds}
                                onSelectionChange={setSelectedMemberIds}
                                columnsToShow={['name', 'garageName', 'status']}
                            />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-8 sticky top-20">
                     <Card>
                        <CardHeader>
                            <CardTitle>Compose Message</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div>
                                <Label htmlFor="message" className="mb-2 block">Notification Message</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Type your notification message here..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={5}
                                    disabled={isSending}
                                />
                            </div>
                            <Button className="w-full" onClick={handleSendNotification} disabled={isSending || selectedMemberIds.length === 0 || !message.trim()}>
                                {isSending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                     <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Send to {selectedMemberIds.length} Member(s)
                                     </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Selected Members ({selectedMemberIds.length})</CardTitle>
                            <CardDescription>Members who will receive this notification.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {selectedMembers.length > 0 ? (
                                <ScrollArea className="h-60">
                                    <div className="space-y-2 pr-4">
                                        {selectedMembers.map(member => (
                                            <div key={member.id} className="text-sm p-2 bg-muted/50 rounded-md">
                                                <p className="font-medium">{member.name}</p>
                                                <p className="text-xs text-muted-foreground">{member.id}</p>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center py-8">
                                    <Users className="h-10 w-10 text-muted-foreground mb-3" />
                                    <p className="text-sm text-muted-foreground">Select members from the table to begin.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
