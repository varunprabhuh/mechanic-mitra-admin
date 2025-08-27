
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, FileText, Edit, Trash2, FileSearch, FileDown, Loader2, UserX, UserCheck, CreditCard, Download, MousePointerClick } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { Member, IdCardLayout } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { generateCertificate } from '@/lib/firebase-actions';
import { getMemberStatus, cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { CertificateDialog } from './certificates-table';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Save, Printer } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useMemberStore } from '@/store/member-store';


type MembersTableProps = {
  members: Member[];
  showHeader?: boolean;
  lastMemberRef?: (node: HTMLTableRowElement) => void;
  selectedMemberIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  columnsToShow?: Array<keyof Member | 'contact' | 'status'>;
};

export function MembersTable({ 
    members, 
    showHeader = true, 
    lastMemberRef,
    selectedMemberIds: controlledSelectedIds,
    onSelectionChange,
    columnsToShow = ['contact', 'garageName', 'status'],
}: MembersTableProps) {
  const [isCertDialogOpen, setIsCertDialogOpen] = React.useState(false);
  const [isIdCardDialogOpen, setIsIdCardDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = React.useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState<Member | null>(null);
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = React.useState(false);
  
  const [internalSelectedMemberIds, setInternalSelectedMemberIds] = React.useState<string[]>([]);
  const selectedMemberIds = controlledSelectedIds ?? internalSelectedMemberIds;
  const setSelectedMemberIds = onSelectionChange ?? setInternalSelectedMemberIds;

  const [isBulkStatusUpdateDialogOpen, setIsBulkStatusUpdateDialogOpen] = React.useState(false);
  const [bulkStatusUpdate, setBulkStatusUpdate] = React.useState<'active' | 'inactive' | null>(null);
  const { setMemberStatus, deleteMember, deleteMembers, setMembersStatus, processingIds } = useMemberStore();
  
  const isAllSelected = selectedMemberIds.length > 0 && selectedMemberIds.length === members.length;
  const isSomeSelected = selectedMemberIds.length > 0 && selectedMemberIds.length < members.length;


  const handleGenerateCertificate = async (member: Member) => {
    setIsGenerating(true);
    let memberWithCert = { ...member };
    
    if (!member.certificate || !member.certificate.id) { // Also check for ID to be safe
        try {
            toast({ title: "Issuing Certificate...", description: `A new certificate is being created for ${member.name}.`});
            const newCertificate = await generateCertificate(member.id);
            memberWithCert.certificate = newCertificate;
            toast({ title: "Certificate Issued Successfully", description: `Certificate for ${member.name} is ready.`});
        } catch(e) {
            toast({ title: "Certificate Generation Failed", description: "Could not create the certificate in the database.", variant: "destructive"});
            setIsGenerating(false);
            return;
        }
    }

    setSelectedMember(memberWithCert);
    setIsCertDialogOpen(true);
    setIsGenerating(false);
  };
  
  const handleGenerateIdCard = (member: Member) => {
    setSelectedMember(member);
    setIsIdCardDialogOpen(true);
  };
  
  const handleDeleteMember = (member: Member) => {
    setSelectedMember(member);
    setIsDeleteDialogOpen(true);
  };

  const handleViewDetails = (member: Member) => {
    setSelectedMember(member);
    setIsDetailsDialogOpen(true);
  }
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMemberIds(members.map(m => m.id));
    } else {
      setSelectedMemberIds([]);
    }
  };

  const handleSelectOne = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMemberIds([...selectedMemberIds, memberId]);
    } else {
      setSelectedMemberIds(selectedMemberIds.filter(id => id !== memberId));
    }
  };

  const confirmDelete = () => {
    if (selectedMember) {
      deleteMember(selectedMember.id, selectedMember.name);
    }
    setIsDeleteDialogOpen(false);
    setSelectedMember(null);
  };

  const confirmBulkDelete = () => {
    if (selectedMemberIds.length > 0) {
      deleteMembers(selectedMemberIds);
      setSelectedMemberIds([]);
    }
    setIsBulkDeleteDialogOpen(false);
  };


  const handleExportToExcel = () => {
    const dataToExport = selectedMemberIds.length > 0
      ? members.filter(m => selectedMemberIds.includes(m.id))
      : members;

    if(dataToExport.length === 0){
        toast({ title: "No data to export", variant: "destructive" });
        return;
    }
    
    toast({ title: "Exporting to Excel...", description: `Preparing ${dataToExport.length} member records.` });

    const formattedData = dataToExport.map(member => ({
        'Member ID': member.id,
        'Name': member.name,
        'Mobile': member.mobile,
        'Email': member.email,
        'Aadhar Number': member.aadharNumber || 'N/A',
        'Driving License': member.drivingLicenseNumber || 'N/A',
        'Address': member.address,
        'Blood Group': member.bloodGroup,
        'Garage Name': member.garageName,
        'Date of Birth': member.dob ? format(parseISO(member.dob), 'dd-MM-yyyy') : 'N/A',
        'Tags': member.tags.join(', '),
        'Status': getMemberStatus(member),
        'Certificate ID': member.certificate?.id || 'N/A',
        'Certificate Issued': member.certificate ? format(parseISO(member.certificate.issuedDate), 'PPP') : 'N/A',
        'Certificate Expiry': member.certificate ? format(parseISO(member.certificate.expiryDate), 'PPP') : 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');
    XLSX.writeFile(workbook, 'Mechanic_Mitra_Members.xlsx');

    toast({ title: "Export Successful", description: `${dataToExport.length} members exported to Excel.` });
  };
  
  const handleToggleStatus = (member: Member) => {
    const newStatus = member.status === 'inactive' ? 'active' : 'inactive';
    setMemberStatus(member.id, member.name, newStatus);
  };
  
  const handleBulkStatusUpdate = (status: 'active' | 'inactive') => {
    setBulkStatusUpdate(status);
    setIsBulkStatusUpdateDialogOpen(true);
  }

  const confirmBulkStatusUpdate = () => {
    if (selectedMemberIds.length > 0 && bulkStatusUpdate) {
      setMembersStatus(selectedMemberIds, bulkStatusUpdate);
      setSelectedMemberIds([]);
    }
    setIsBulkStatusUpdateDialogOpen(false);
    setBulkStatusUpdate(null);
  }


  const getStatusVariant = (status: 'Active' | 'Expired' | 'Not Issued' | 'Inactive') => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Expired':
      case 'Inactive':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <>
      {!onSelectionChange && (
        <div className="mb-4 flex items-center flex-wrap gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={handleExportToExcel} disabled={isGenerating}>
                <FileDown className="mr-2 h-4 w-4" />
                {selectedMemberIds.length > 0 ? `Export ${selectedMemberIds.length} Selected` : 'Export All'}
            </Button>
            {selectedMemberIds.length > 0 && (
              <>
                  <Button variant="outline" onClick={() => handleBulkStatusUpdate('active')} disabled={isGenerating}>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Make Active ({selectedMemberIds.length})
                  </Button>
                  <Button variant="outline" onClick={() => handleBulkStatusUpdate('inactive')} disabled={isGenerating}>
                      <UserX className="mr-2 h-4 w-4" />
                      Make Inactive ({selectedMemberIds.length})
                  </Button>
                  <Button variant="destructive" onClick={() => setIsBulkDeleteDialogOpen(true)} disabled={isGenerating}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete ({selectedMemberIds.length})
                  </Button>
              </>
            )}
          </div>
        </div>
      )}
      <div className="rounded-lg border">
        <Table>
          {showHeader && (
            <TableHeader>
              <TableRow>
                 <TableHead className="w-12">
                   <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                    aria-label="Select all"
                  />
                 </TableHead>
                <TableHead>Member</TableHead>
                {columnsToShow.includes('contact') && <TableHead>Contact</TableHead>}
                {columnsToShow.includes('status') && <TableHead>Status</TableHead>}
                {columnsToShow.includes('garageName') && <TableHead className="hidden md:table-cell">Garage</TableHead>}
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
          )}
          <TableBody>
            {members.map((member, index) => {
              const status = getMemberStatus(member);
              const isSelected = selectedMemberIds.includes(member.id);
              const isLastElement = index === members.length -1;
              const hasCertificate = !!member.certificate;
              const isProcessing = processingIds.has(member.id);
              
              return (
              <TableRow 
                key={member.id} 
                data-state={isSelected ? "selected" : ""}
                ref={isLastElement ? lastMemberRef : null}
                className={cn("relative", isProcessing && "opacity-50 pointer-events-none")}
              >
                {isProcessing && (
                  <td colSpan={6} className="absolute inset-0 bg-background/50 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </td>
                )}
                 <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleSelectOne(member.id, Boolean(checked))}
                    aria-label={`Select row ${member.id}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.photoUrl} alt={member.name} />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground">{member.id}</div>
                    </div>
                  </div>
                </TableCell>
                {columnsToShow.includes('contact') && (
                    <TableCell>
                      <div className="text-sm">{member.mobile}</div>
                      <div className="text-xs text-muted-foreground">{member.email}</div>
                    </TableCell>
                )}
                {columnsToShow.includes('status') && (
                    <TableCell>
                      <Badge variant={getStatusVariant(status)}>
                        {status}
                      </Badge>
                      {status === 'Active' && !hasCertificate && <div className="text-xs text-muted-foreground mt-1">No Certificate</div>}
                    </TableCell>
                )}
                {columnsToShow.includes('garageName') && (
                    <TableCell className="hidden md:table-cell">{member.garageName}</TableCell>
                )}
                <TableCell>
                  {!onSelectionChange && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isGenerating}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => handleViewDetails(member)} disabled={isGenerating}>
                          <FileSearch className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleGenerateIdCard(member)} disabled={isGenerating}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Generate ID Card
                        </DropdownMenuItem>
                        {member.status !== 'inactive' && (
                          <DropdownMenuItem onSelect={() => handleGenerateCertificate(member)} disabled={isGenerating}>
                            {isGenerating && selectedMember?.id === member.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                            {member.certificate ? 'View/Re-issue Certificate' : 'Generate Certificate'}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onSelect={() => handleToggleStatus(member)}>
                          {member.status === 'inactive' ? (
                              <><UserCheck className="mr-2 h-4 w-4" />Make Active</>
                          ) : (
                              <><UserX className="mr-2 h-4 w-4" />Make Inactive</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild disabled={isGenerating}>
                          <Link href={`/members/edit/${member.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Member
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onSelect={() => handleDeleteMember(member)} disabled={isGenerating}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </div>
      <MemberDetailsDialog
        isOpen={isDetailsDialogOpen}
        setIsOpen={setIsDetailsDialogOpen}
        member={selectedMember}
      />
      <CertificateDialog 
        isOpen={isCertDialogOpen}
        setIsOpen={setIsCertDialogOpen}
        member={selectedMember}
        viewOnly={false}
      />
      <IdCardDialog
        isOpen={isIdCardDialogOpen}
        setIsOpen={setIsIdCardDialogOpen}
        member={selectedMember}
        viewOnly={false}
      />
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        memberName={selectedMember?.name}
      />
      <BulkDeleteConfirmationDialog
        isOpen={isBulkDeleteDialogOpen}
        setIsOpen={setIsBulkDeleteDialogOpen}
        onConfirm={confirmBulkDelete}
        count={selectedMemberIds.length}
      />
       <BulkStatusUpdateConfirmationDialog
        isOpen={isBulkStatusUpdateDialogOpen}
        setIsOpen={setIsBulkStatusUpdateDialogOpen}
        onConfirm={confirmBulkStatusUpdate}
        count={selectedMemberIds.length}
        status={bulkStatusUpdate}
      />
    </>
  );
}


function MemberDetailsDialog({
  isOpen,
  setIsOpen,
  member,
}: {
  isOpen: boolean,
  setIsOpen: (open: boolean) => void,
  member: Member | null,
}) {
  const [previewDoc, setPreviewDoc] = React.useState<{ url: string, name: string } | null>(null);

  if (!member) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
  
  const status = getMemberStatus(member);
  
  const docTypes: { key: keyof NonNullable<Member['documents']>, label: string }[] = [
    { key: 'aadhar', label: 'Aadhar Card' },
    { key: 'dl', label: 'Driving License' },
    { key: 'pan', label: 'PAN Card' },
    { key: 'ration', label: 'Ration Card' },
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
            <DialogDescription>
              Full profile information for {member.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={member.photoUrl} alt={member.name} />
                  <AvatarFallback className="text-2xl">{getInitials(member.name)}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <p className="text-xl font-semibold">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.id}</p>
                  <Badge variant={status === 'Active' ? 'success' : 'destructive'}>{status}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <p className="font-medium text-muted-foreground">Garage Name</p>
                  <p>{member.garageName}</p>
                  
                  <p className="font-medium text-muted-foreground">Mobile</p>
                  <p>{member.mobile}</p>

                  <p className="font-medium text-muted-foreground">Email</p>
                  <p>{member.email}</p>

                   <p className="font-medium text-muted-foreground">Date of Birth</p>
                  <p>{member.dob ? format(parseISO(member.dob), 'dd-MM-yyyy') : 'N/A'}</p>

                   <p className="font-medium text-muted-foreground">Aadhar No.</p>
                  <p>{member.aadharNumber || 'N/A'}</p>

                  <p className="font-medium text-muted-foreground">Driving License</p>
                  <p>{member.drivingLicenseNumber || 'N/A'}</p>

                  <p className="font-medium text-muted-foreground col-span-2">Address</p>
                  <p className="col-span-2">{member.address}</p>

                  <p className="font-medium text-muted-foreground">Blood Group</p>
                  <p>{member.bloodGroup}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm mb-2">Certificate Details</h4>
                {member.certificate ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm p-3 rounded-md bg-muted/50">
                      <p className="font-medium text-muted-foreground">Certificate ID</p>
                      <p>{member.certificate.id}</p>
                      <p className="font-medium text-muted-foreground">Issued Date</p>
                      <p>{format(parseISO(member.certificate.issuedDate), 'PPP')}</p>
                      <p className="font-medium text-muted-foreground">Expiry Date</p>
                      <p>{format(parseISO(member.certificate.expiryDate), 'PPP')}</p>
                  </div>
                ) : (
                   <p className="text-sm text-muted-foreground p-3 rounded-md bg-muted/50">No certificate information available.</p>
                )}
              </div>

               <div>
                <h4 className="font-semibold text-sm mb-2">Documents</h4>
                  <div className="flex flex-wrap gap-2">
                    {docTypes.map(docType => {
                       const docUrl = member.documents?.[docType.key];
                       if (!docUrl) return null;
                       return (
                           <Button 
                              key={docType.key} 
                              variant="secondary" 
                              size="sm" 
                              onClick={() => setPreviewDoc({ url: docUrl, name: `${member.name}-${docType.label}` })}
                            >
                               <FileSearch className="mr-2 h-4 w-4"/>
                               {docType.label}
                           </Button>
                       )
                    })}
                      {!member.documents || Object.values(member.documents).every(v => !v) && <p className="text-sm text-muted-foreground">No documents uploaded.</p>}
                  </div>
              </div>

              <div>
                 <h4 className="font-semibold text-sm mb-2">Tags</h4>
                 <div className="flex flex-wrap gap-2">
                   {member.tags && member.tags.length > 0 ? (
                      member.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)
                   ) : (
                      <p className="text-sm text-muted-foreground">No tags assigned.</p>
                   )}
                 </div>
              </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DocumentPreviewDialog 
        isOpen={!!previewDoc} 
        setIsOpen={() => setPreviewDoc(null)} 
        doc={previewDoc} 
      />
    </>
  );
}

function DocumentPreviewDialog({
  isOpen,
  setIsOpen,
  doc,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  doc: { url: string; name: string } | null;
}) {
  if (!doc) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = doc.url;
    
    const fileType = doc.url.substring(doc.url.indexOf('/') + 1, doc.url.indexOf(';'));
    link.download = `${doc.name}.${fileType}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const isPdf = doc.url.includes('application/pdf');
  const isImage = doc.url.startsWith('data:image');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{doc.name}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 bg-muted rounded-md flex items-center justify-center overflow-hidden">
          {isImage && (
            <img src={doc.url} alt={doc.name} className="max-w-full max-h-full object-contain" />
          )}
          {isPdf && (
            <embed src={doc.url} type="application/pdf" className="w-full h-full" />
          )}
          {!isImage && !isPdf && (
            <div className="text-center text-muted-foreground p-8">
              <p className="font-semibold text-lg mb-2">Preview not available</p>
              <p>You can download the file to view it.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
          <Button onClick={handleDownload}><Download className="mr-2 h-4 w-4" />Download</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirmationDialog({
  isOpen,
  setIsOpen,
  onConfirm,
  memberName,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onConfirm: () => void;
  memberName: string | undefined;
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the member account for <span className="font-semibold">{memberName || 'this member'}</span> and remove their data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function BulkDeleteConfirmationDialog({
  isOpen,
  setIsOpen,
  onConfirm,
  count,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onConfirm: () => void;
  count: number;
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{' '}
            <span className="font-semibold">{count} member(s)</span> from our
            servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Yes, delete {count} member(s)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function BulkStatusUpdateConfirmationDialog({
  isOpen,
  setIsOpen,
  onConfirm,
  count,
  status,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onConfirm: () => void;
  count: number;
  status: 'active' | 'inactive' | null;
}) {
  if (!status) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to set{' '}
            <span className="font-semibold">{count} member(s)</span> to{' '}
            <span className="font-semibold">{status}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Yes, update status
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function IdCardDialog({ 
  isOpen, 
  setIsOpen, 
  member,
  viewOnly = false,
}: { 
  isOpen: boolean, 
  setIsOpen: (open: boolean) => void, 
  member: Member | null,
  viewOnly?: boolean,
}) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [positions, setPositions] = React.useState<IdCardLayout>(initialIdCardPositions);
  const [selectedElement, setSelectedElement] = React.useState<IdCardPositionableElement>('name');
  const frontPreviewRef = React.useRef<HTMLDivElement>(null);
  const backPreviewRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    async function loadLayout() {
        try {
            const { getIdCardLayout } = await import('@/lib/firebase-actions');
            const savedLayout = await getIdCardLayout();
            if (savedLayout) {
                const fullLayout = { ...initialIdCardPositions, ...savedLayout };
                 Object.keys(initialIdCardPositions).forEach(key => {
                    fullLayout[key as IdCardPositionableElement] = {
                        ...initialIdCardPositions[key as IdCardPositionableElement],
                        ...(savedLayout[key as IdCardPositionableElement] || {}),
                    };
                });
                setPositions(fullLayout);
            } else {
                setPositions(initialIdCardPositions);
            }
        } catch (e) {
            console.error("Failed to load ID card layout", e);
            setPositions(initialIdCardPositions);
        }
    }
    if (isOpen) {
        setIsFlipped(false); // Reset flip state when dialog opens
        loadLayout();
    }
  }, [isOpen]);
  
  const handleDownloadIdCard = () => {
    if (!member) return;
    const frontContent = frontPreviewRef.current;
    const backContent = backPreviewRef.current;
    if (!frontContent || !backContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: "Could not open print window", description: "Please allow pop-ups for this website.", variant: "destructive"});
      return;
    }

    const fileName = `${member.id}-${member.name}-id-card.pdf`;
    const newDocument = printWindow.document;
    newDocument.write(`<html><head><title>${fileName}</title>`);
    
    newDocument.write(`
      <style>
        body { margin: 0; }
        @page { size: 105mm 74mm; margin: 0; }
        .id-card-print-container {
          width: 396px;
          height: 280px;
          transform-origin: top left;
          page-break-inside: avoid;
          page-break-after: always;
        }
      </style>
    `);
    newDocument.write('</head><body></body></html>');
    
    const clonedFrontNode = frontContent.cloneNode(true) as HTMLElement;
    const clonedBackNode = backContent.cloneNode(true) as HTMLElement;

    const selectedInFront = clonedFrontNode.querySelector('[data-selected="true"]');
    if(selectedInFront) {
      selectedInFront.setAttribute('style', selectedInFront.getAttribute('style') + '; outline: none !important;');
    }
    
    newDocument.body.appendChild(clonedFrontNode);
    newDocument.body.appendChild(clonedBackNode);
    newDocument.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 500);
  };
  
  const handleSaveLayout = async () => {
    setIsSaving(true);
    try {
        const { saveIdCardLayout } = await import('@/lib/firebase-actions');
        await saveIdCardLayout(positions);
        toast({
            title: "Layout Saved",
            description: "The new ID card layout has been saved."
        });
    } catch (e) {
        toast({
            title: "Save Failed",
            description: "Could not save the ID card layout.",
            variant: "destructive"
        })
    } finally {
        setIsSaving(false);
    }
  }

  const handlePositionChange = (axis: keyof IdCardElementPosition, value: string) => {
    const numValue = parseInt(value, 10);
    const targetValue = ['top', 'left', 'fontSize', 'width', 'height'].includes(axis as string) && !isNaN(numValue) ? numValue : value;
    
    setPositions(prev => ({
        ...prev,
        [selectedElement]: {
            ...prev[selectedElement],
            [axis]: targetValue
        }
    }));
  };
  
  const currentPos = positions[selectedElement];

  if (!member) return null;

  return (
     <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col sm:flex-row">
        <div className="flex-1 min-h-0 overflow-auto bg-gray-200 dark:bg-gray-800 flex justify-center items-center p-4 [perspective:1000px]">
            <div 
                className={cn(
                    "relative w-[396px] h-[280px] transition-transform duration-700 [transform-style:preserve-3d] cursor-pointer group",
                    isFlipped && "[transform:rotateY(180deg)]"
                )}
                onClick={() => viewOnly && setIsFlipped(f => !f)}
            >
                {viewOnly && (
                   <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <div className="flex items-center gap-2 text-white font-semibold">
                            <MousePointerClick className="h-5 w-5" />
                            Click to flip
                        </div>
                    </div>
                )}
                <IdCardPreview 
                  ref={frontPreviewRef} 
                  member={member} 
                  positions={positions}
                  selectedElement={selectedElement}
                  onElementSelect={viewOnly ? ()=>{} : setSelectedElement}
                  viewOnly={viewOnly}
                />
                <IdCardBackPreview ref={backPreviewRef} />
            </div>
        </div>
        {!viewOnly && (
            <div className="sm:w-96 flex flex-col gap-4 p-4 border-t sm:border-t-0 sm:border-l flex-shrink-0">
                <DialogHeader className="text-left">
                    <DialogTitle>ID Card Editor</DialogTitle>
                    <DialogDescription>
                        Click an element on the front card to adjust its position and style.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 overflow-y-auto pr-2">
                    <div className="space-y-2">
                        <Label htmlFor="element-select">Selected Element</Label>
                        <Input id="element-select" value={selectedElement.replace(/([A-Z])/g, ' $1')} readOnly className="capitalize font-semibold" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                            <Label htmlFor="pos-top">Top (px)</Label>
                            <Input 
                                id="pos-top" 
                                type="number" 
                                value={currentPos.top || 0}
                                onChange={(e) => handlePositionChange('top', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pos-left">Left (px)</Label>
                            <Input 
                                id="pos-left" 
                                type="number"
                                value={currentPos.left || 0}
                                onChange={(e) => handlePositionChange('left', e.target.value)}
                            />
                        </div>
                    </div>
                    { selectedElement === 'photo' ? (
                    <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <Label htmlFor="pos-width">Width (px)</Label>
                                <Input 
                                    id="pos-width" 
                                    type="number"
                                    value={currentPos.width || ''}
                                    onChange={(e) => handlePositionChange('width', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pos-height">Height (px)</Label>
                                <Input 
                                    id="pos-height" 
                                    type="number"
                                    value={currentPos.height || ''}
                                    onChange={(e) => handlePositionChange('height', e.target.value)}
                                />
                            </div>
                    </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <Label htmlFor="pos-fontSize">Font Size (px)</Label>
                                    <Input 
                                        id="pos-fontSize" 
                                        type="number"
                                        value={currentPos.fontSize || 14}
                                        onChange={(e) => handlePositionChange('fontSize', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pos-width">Width (px)</Label>
                                    <Input 
                                        id="pos-width" 
                                        type="number"
                                        value={currentPos.width || ''}
                                        onChange={(e) => handlePositionChange('width', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <Label htmlFor="pos-color">Font Color</Label>
                                    <Input 
                                        id="pos-color" 
                                        type="text"
                                        value={currentPos.color || '#000000'}
                                        onChange={(e) => handlePositionChange('color', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pos-fontWeight">Font Weight</Label>
                                    <Select onValueChange={(v) => handlePositionChange('fontWeight', v as 'normal' | 'bold')} defaultValue={currentPos.fontWeight}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="normal">Normal</SelectItem>
                                            <SelectItem value="bold">Bold</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <Label htmlFor="pos-textAlign">Text Align</Label>
                                    <Select onValueChange={(v) => handlePositionChange('textAlign', v as 'left' | 'center' | 'right')} defaultValue={currentPos.textAlign}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="left">Left</SelectItem>
                                            <SelectItem value="center">Center</SelectItem>
                                            <SelectItem value="right">Right</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pos-textTransform">Text Transform</Label>
                                    <Select onValueChange={(v) => handlePositionChange('textTransform', v as 'none' | 'uppercase')} defaultValue={currentPos.textTransform}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="uppercase">Uppercase</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {selectedElement === 'detailsLine4' && (
                                <div className="space-y-2">
                                    <Label htmlFor="pos-backgroundColor">Highlight Color</Label>
                                    <Input 
                                        id="pos-backgroundColor" 
                                        type="text"
                                        placeholder="e.g., #FFDDDD"
                                        value={currentPos.backgroundColor || ''}
                                        onChange={(e) => handlePositionChange('backgroundColor', e.target.value)}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter className="mt-auto sm:justify-end flex-shrink-0 pt-4 border-t">
                    <div className="flex flex-col-reverse sm:flex-row sm:flex-wrap justify-end gap-2 w-full">
                        <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full sm:w-auto">Close</Button>
                        <Button onClick={handleSaveLayout} disabled={isSaving} className="w-full sm:w-auto">
                            {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Layout
                        </Button>
                        <Button onClick={handleDownloadIdCard} className="w-full sm:w-auto">
                            <Printer className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>
                    </div>
                </DialogFooter>
            </div>
        )}
         {viewOnly && !isFlipped && (
          <DialogFooter className="absolute bottom-4 left-1/2 -translate-x-1/2">
             {/* No footer content for view only to keep it clean */}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

const initialIdCardPositions: IdCardLayout = {
  photo: { top: 92, left: 24, width: 90, height: 112 },
  name: { top: 92, left: 126, fontSize: 15, fontWeight: 'bold', color: '#0D47A1', width: 250, textAlign: 'left', textTransform: 'uppercase'},
  shopName: { top: 115, left: 126, fontSize: 10, fontWeight: 'bold', color: '#000000', width: 250, textAlign: 'left', textTransform: 'uppercase' },
  address: { top: 130, left: 126, fontSize: 10, fontWeight: 'normal', color: '#333333', width: 250, textAlign: 'left' },
  detailsLine1: { top: 216, left: 25, fontSize: 11, fontWeight: 'normal', color: '#000000' },
  dob: { top: 216, left: 160, fontSize: 11, fontWeight: 'normal', color: '#000000' },
  detailsLine2: { top: 236, left: 25, fontSize: 11, fontWeight: 'normal', color: '#000000' },
  dlNumber: { top: 236, left: 160, fontSize: 11, fontWeight: 'normal', color: '#000000' },
  detailsLine4: { top: 216, left: 290, fontSize: 11, fontWeight: 'bold', color: '#D32F2F' },
};


type IdCardPreviewProps = {
  member: Member;
  positions: IdCardLayout;
  selectedElement: IdCardPositionableElement;
  onElementSelect: (element: IdCardPositionableElement) => void;
  viewOnly: boolean;
};

const IdCardPreview = React.forwardRef<HTMLDivElement, IdCardPreviewProps>(({ member, positions, selectedElement, onElementSelect, viewOnly }, ref) => {
  const createStyle = (key: IdCardPositionableElement): React.CSSProperties => {
    const isSelected = key === selectedElement;
    const pos = positions[key];
    const baseStyle: React.CSSProperties = {
        position: 'absolute',
        margin: 0,
        padding: '2px',
        cursor: viewOnly ? 'pointer' : 'pointer',
        outline: !viewOnly && isSelected ? '2px dashed #007bff' : 'none',
        outlineOffset: '2px',
        top: `${pos.top || 0}px`,
        left: `${pos.left || 0}px`,
    };

    if (key === 'photo') {
      return {
        ...baseStyle,
        width: `${pos.width || 120}px`,
        height: `${pos.height || 150}px`,
        objectFit: 'cover',
        border: '3px solid white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      };
    }
    
    const textStyle: React.CSSProperties = {
        fontFamily: "'PT Sans', sans-serif",
        fontSize: `${pos.fontSize || 14}px`,
        fontWeight: pos.fontWeight || 'normal',
        color: pos.color || '#000000',
        width: pos.width ? `${pos.width}px` : 'auto',
        textAlign: pos.textAlign || 'left',
        textTransform: pos.textTransform || 'none',
        backgroundColor: pos.backgroundColor || 'transparent',
    };

    if (key !== 'address') {
      textStyle.whiteSpace = 'nowrap';
    } else {
        textStyle.lineHeight = '1.3';
        textStyle.whiteSpace = 'normal';
    }

    return {
        ...baseStyle,
        ...textStyle,
    };
  };

  const validUptoDate = member.certificate ? format(parseISO(member.certificate.expiryDate), 'dd-MM-yyyy') : 'N/A';
  const validUptoStyle = createStyle('detailsLine4');

  return (
    <div 
      ref={ref} 
      className="absolute w-full h-full [backface-visibility:hidden] rounded-lg id-card-print-container"
      style={{
          backgroundImage: "url('/id/id-front.png')", 
          backgroundSize: 'cover', 
          backgroundRepeat: 'no-repeat', 
          backgroundPosition: 'center',
          printColorAdjust: 'exact',
      }}
    >
        <img 
            src={member.photoUrl} 
            alt={member.name} 
            style={createStyle('photo')}
            onClick={() => !viewOnly && onElementSelect('photo')}
            data-selected={selectedElement === 'photo' && !viewOnly}
        />
        
        <p style={createStyle('name')} onClick={() => !viewOnly && onElementSelect('name')} data-selected={selectedElement === 'name' && !viewOnly}>
            {member.name}
        </p>
        <p style={createStyle('shopName')} onClick={() => !viewOnly && onElementSelect('shopName')} data-selected={selectedElement === 'shopName' && !viewOnly}>
            {member.garageName}
        </p>
         <p style={createStyle('address')} onClick={() => !viewOnly && onElementSelect('address')} data-selected={selectedElement === 'address' && !viewOnly}>
            {member.address}
        </p>
        <p style={createStyle('detailsLine1')} onClick={() => !viewOnly && onElementSelect('detailsLine1')} data-selected={selectedElement === 'detailsLine1' && !viewOnly}>
            <span style={{fontWeight: 'bold'}}>ID:</span> {member.id} | <span style={{fontWeight: 'bold'}}>Blood:</span> {member.bloodGroup}
        </p>
        <p style={createStyle('dob')} onClick={() => !viewOnly && onElementSelect('dob')} data-selected={selectedElement === 'dob' && !viewOnly}>
            <span style={{fontWeight: 'bold'}}>DOB:</span> {member.dob ? format(parseISO(member.dob), 'dd-MM-yyyy') : 'N/A'}
        </p>
        <p style={createStyle('detailsLine2')} onClick={() => !viewOnly && onElementSelect('detailsLine2')} data-selected={selectedElement === 'detailsLine2' && !viewOnly}>
            <span style={{fontWeight: 'bold'}}>Mobile:</span> {member.mobile}
        </p>
        <p style={createStyle('dlNumber')} onClick={() => !viewOnly && onElementSelect('dlNumber')} data-selected={selectedElement === 'dlNumber' && !viewOnly}>
            <span style={{fontWeight: 'bold'}}>DL:</span> {member.drivingLicenseNumber || 'N/A'}
        </p>
         <p style={validUptoStyle} onClick={() => !viewOnly && onElementSelect('detailsLine4')} data-selected={selectedElement === 'detailsLine4' && !viewOnly}>
            <span style={{fontWeight: 'bold', color: validUptoStyle.color}}>Valid:</span> {validUptoDate}
        </p>
    </div>
  );
});
IdCardPreview.displayName = 'IdCardPreview';


const IdCardBackPreview = React.forwardRef<HTMLDivElement, {}>((props, ref) => {
  return (
    <div
      ref={ref}
      className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-lg id-card-print-container"
      style={{
        backgroundImage: "url('/id/id-back.png')",
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        printColorAdjust: 'exact',
      }}
    >
      {/* No editable elements on the back for now */}
    </div>
  );
});
IdCardBackPreview.displayName = 'IdCardBackPreview';

type IdCardPositionableElement = 'photo' | 'name' | 'shopName' | 'detailsLine1' | 'detailsLine2' | 'dlNumber' | 'detailsLine4' | 'dob' | 'address';

type IdCardElementPosition = {
  top: number;
  left: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  textTransform?: 'none' | 'uppercase';
  backgroundColor?: string;
};

type IdCardUILayout = Record<IdCardPositionableElement, IdCardElementPosition>;

    

    

    

    



