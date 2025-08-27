
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
import { MoreHorizontal, AlertTriangle, Send, RefreshCw, Loader2, FileText, Save, Settings, Printer } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Member, CertificateLayout } from '@/lib/types';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { renewCertificate, getCertificateLayout, saveCertificateLayout, sendCertificateReminder } from '@/lib/firebase-actions';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useMemberStore } from '@/store/member-store';
import { cn } from '@/lib/utils';

type PositionableElement = 'photo' | 'name' | 'garage' | 'address' | 'meta' | 'issuedDate' | 'expiryDate';

type ElementPosition = {
  top: number;
  left: number;
  lineSpacing?: number;
};

export const initialPositions: CertificateLayout = {
  photo: { top: 223, left: 530 },
  name: { top: 457, left: 154 },
  garage: { top: 508, left: 122 },
  address: { top: 564, left: 80, lineSpacing: 32 },
  meta: { top: 390, left: 132 },
  issuedDate: { top: 765, left: 240 },
  expiryDate: { top: 765, left: 468 },
};

type CertificatesTableProps = {
  members: Member[];
  lastMemberRef?: (node: HTMLTableRowElement) => void;
};

export function CertificatesTable({ members, lastMemberRef }: CertificatesTableProps) {
  const { toast } = useToast();
  const { renewMemberCertificate, processingIds } = useMemberStore();
  const [isCertDialogOpen, setIsCertDialogOpen] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState<Member | null>(null);
  const [isSendingReminder, setIsSendingReminder] = React.useState<string | null>(null);


  const handleSendReminder = async (member: Member) => {
    setIsSendingReminder(member.id);
    try {
        await sendCertificateReminder(member.id);
        toast({
            title: "Reminder Sent",
            description: `Renewal reminder sent to ${member.name}.`,
        });
    } catch (error) {
         toast({
            title: "Failed to Send Reminder",
            description: `Could not send a reminder to ${member.name}.`,
            variant: "destructive"
        });
    } finally {
        setIsSendingReminder(null);
    }
  };

  const handleRenewCertificate = async (memberId: string, memberName: string) => {
    await renewMemberCertificate(memberId, memberName);
  };
  
  const handleDownloadCertificate = (member: Member) => {
     if (!member.certificate) {
        toast({ title: "No certificate to download", variant: "destructive" });
        return;
    }
    setSelectedMember(member);
    setIsCertDialogOpen(true);
  };

  const handleOpenPreview = (member: Member) => {
    setSelectedMember(member);
    setIsCertDialogOpen(true);
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
  
  const getExpiryDetails = (expiryDateStr: string) => {
    const expiryDate = parseISO(expiryDateStr);
    const now = new Date();
    const isExpired = expiryDate < now;
    const distance = formatDistanceToNow(expiryDate, { addSuffix: true });
    const text = isExpired ? `Expired ${distance}` : `Expires ${distance}`;
    
    return { isExpired, text, date: expiryDate };
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Certificate Status</TableHead>
              <TableHead className="hidden md:table-cell">Expiry Date</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member, index) => {
              if (!member.certificate) return null;
              const { isExpired, text, date } = getExpiryDetails(member.certificate.expiryDate);
              const isProcessing = processingIds.has(member.id) || isSendingReminder === member.id;
              const isLastElement = index === members.length - 1;

              return (
                 <TableRow 
                    key={member.id} 
                    className={cn("relative", isExpired && 'bg-destructive/10', isProcessing && "opacity-50 pointer-events-none")} 
                    ref={isLastElement ? lastMemberRef : null}
                  >
                  {isProcessing && (
                    <td colSpan={4} className="absolute inset-0 bg-background/50 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </td>
                  )}
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.photoUrl} alt={member.name} data-ai-hint="person portrait" />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground">{member.id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                   <Badge variant={isExpired ? 'destructive' : 'default'}>
                      <AlertTriangle className="mr-2 h-4 w-4"/>
                      {text}
                   </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="font-medium">{format(date, 'PPP')}</div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => handleRenewCertificate(member.id, member.name)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Renew Certificate
                      </DropdownMenuItem>
                       <DropdownMenuItem onSelect={() => handleOpenPreview(member)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Preview & Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleSendReminder(member)}>
                        <Send className="mr-2 h-4 w-4" />
                        Send Reminder
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
       <CertificateDialog 
        isOpen={isCertDialogOpen}
        setIsOpen={setIsCertDialogOpen}
        member={selectedMember}
      />
    </>
  );
}

export function CertificateDialog({ 
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
  const [positions, setPositions] = React.useState<CertificateLayout>(initialPositions);
  const [selectedElement, setSelectedElement] = React.useState<PositionableElement>('name');
  const previewRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    async function loadLayout() {
        try {
            const savedLayout = await getCertificateLayout();
            if (savedLayout) {
                // Merge with initialPositions to ensure all keys are present
                const fullLayout = { ...initialPositions, ...savedLayout };
                // Ensure nested properties are also present
                 Object.keys(initialPositions).forEach(key => {
                    fullLayout[key as PositionableElement] = {
                        ...initialPositions[key as PositionableElement],
                        ...(savedLayout[key as PositionableElement] || {}),
                    };
                });
                setPositions(fullLayout);
            } else {
                setPositions(initialPositions);
            }
        } catch (e) {
            console.error("Failed to load layout", e);
            setPositions(initialPositions); // Fallback to default
        }
    }
    if (isOpen) {
        loadLayout();
    }
  }, [isOpen]);
  
  const handlePrint = () => {
    const content = previewRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: "Could not open print window", description: "Please allow pop-ups for this website.", variant: "destructive"});
      return;
    }
    
    const fileName = `${member?.id}-${member?.name}-certificate.pdf`;

    const newDocument = printWindow.document;
    newDocument.write(`<html><head><title>${fileName}</title>`);
    
    // Inject styles for printing
    newDocument.write(`
      <style>
        @import url('https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=Great+Vibes&family=Tiro+Kannada&display=swap');
        body { margin: 0; }
        @page { size: A4; margin: 0; }
        .certificate-print-container {
          width: 800px;
          height: 1131px;
          position: relative;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      </style>
    `);
    newDocument.write('</head><body></body></html>');

    // Clone the node to avoid moving the original from the DOM
    const clonedNode = content.cloneNode(true) as HTMLElement;
    // Remove outline from selected element in print version
    const selectedInPrint = clonedNode.querySelector('[data-selected="true"]');
    if(selectedInPrint) {
      selectedInPrint.setAttribute('style', selectedInPrint.getAttribute('style') + '; outline: none !important;');
    }
    
    newDocument.body.appendChild(clonedNode);
    newDocument.close(); // Necessary for some browsers

    // Delay print to allow content to render
    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }, 500);
  };
  
  const handleSaveLayout = async () => {
    setIsSaving(true);
    try {
        await saveCertificateLayout(positions);
        toast({
            title: "Layout Saved",
            description: "The new certificate layout has been saved."
        });
    } catch (e) {
        toast({
            title: "Save Failed",
            description: "Could not save the certificate layout.",
            variant: "destructive"
        })
    } finally {
        setIsSaving(false);
    }
  }

  const handlePositionChange = (axis: 'top' | 'left' | 'lineSpacing', value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
        setPositions(prev => ({
            ...prev,
            [selectedElement]: {
                ...prev[selectedElement],
                [axis]: numValue
            }
        }));
    }
  };

  
  if (!member) return null;

  return (
     <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col sm:flex-row">
        <div className="flex-1 min-h-0 overflow-auto bg-gray-200 flex justify-center items-start p-4">
            <CertificatePreview 
              ref={previewRef} 
              member={member} 
              positions={positions}
              selectedElement={selectedElement}
              onElementSelect={viewOnly ? ()=>{} : setSelectedElement}
              viewOnly={viewOnly}
            />
        </div>
        {!viewOnly && (
            <div className="sm:w-80 flex flex-col gap-4 p-4 border-t sm:border-t-0 sm:border-l">
                <DialogHeader className="text-left">
                    <DialogTitle>Certificate Editor</DialogTitle>
                    <DialogDescription>
                        Click an element to adjust its position, then save the layout.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
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
                                value={positions[selectedElement].top}
                                onChange={(e) => handlePositionChange('top', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pos-left">Left (px)</Label>
                            <Input 
                                id="pos-left" 
                                type="number"
                                value={positions[selectedElement].left}
                                onChange={(e) => handlePositionChange('left', e.target.value)}
                            />
                        </div>
                    </div>
                    {selectedElement === 'address' && (
                        <div className="space-y-2">
                            <Label htmlFor="pos-line-spacing">Line Spacing (px)</Label>
                            <Input 
                                id="pos-line-spacing" 
                                type="number"
                                value={positions.address.lineSpacing || 32}
                                onChange={(e) => handlePositionChange('lineSpacing', e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-auto sm:justify-end flex-shrink-0 pt-4 border-t">
                    <div className="flex flex-col-reverse sm:flex-row sm:flex-wrap justify-end gap-2 w-full">
                        <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full sm:w-auto">Close</Button>
                        <Button onClick={handleSaveLayout} disabled={isSaving} className="w-full sm:w-auto">
                            {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Layout
                        </Button>
                        <Button onClick={handlePrint} className="w-full sm:w-auto">
                            <Printer className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>
                    </div>
                </DialogFooter>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

type CertificatePreviewProps = {
  member: Member;
  positions: CertificateLayout;
  selectedElement: PositionableElement;
  onElementSelect: (element: PositionableElement) => void;
  viewOnly: boolean;
};

const CertificatePreview = React.forwardRef<HTMLDivElement, CertificatePreviewProps>(({ member, positions, selectedElement, onElementSelect, viewOnly }, ref) => {
  const issuedDate = member.certificate ? format(parseISO(member.certificate.issuedDate), 'dd-MM-yyyy') : 'N/A';
  const expiryDate = member.certificate ? format(parseISO(member.certificate.expiryDate), 'dd-MM-yyyy') : 'N/A';
  const certificateId = member.certificate?.id || 'N/A';
  const memberId = member.id;
  const backgroundUrl = '/certificate/certificate-background.png';
  
  const createStyle = (key: PositionableElement): React.CSSProperties => {
    const isSelected = key === selectedElement;
    const position = positions[key];
    const baseTextStyle: React.CSSProperties = {
        fontFamily: "'Times New Roman', Times, serif",
        color: '#00008B', // Dark Blue
        position: 'absolute',
        margin: 0,
        padding: '2px 5px',
        display: 'block',
        wordSpacing: 'normal',
        top: `${position.top}px`,
        left: `${position.left}px`,
        cursor: viewOnly ? 'default' : 'pointer',
        outline: !viewOnly && isSelected ? '2px dashed #007bff' : 'none',
        outlineOffset: '2px',
    };

    switch (key) {
        case 'name':
            return {
                ...baseTextStyle,
                color: 'red',
                width: '450px',
                textAlign: 'center',
                fontSize: '28px',
                fontWeight: 'bold',
            };
        case 'garage':
            return {
                ...baseTextStyle,
                width: '480px',
                textAlign: 'center',
                fontSize: '28px',
                fontWeight: 'bold',
            };
        case 'address':
            return {
                ...baseTextStyle,
                width: '580px',
                textAlign: 'center',
                fontSize: '24px',
                lineHeight: position.lineSpacing ? `${position.lineSpacing}px` : 'normal',
            };
        case 'meta':
             return {
                ...baseTextStyle,
                fontSize: '18px',
            };
        case 'issuedDate':
        case 'expiryDate':
            return {
                ...baseTextStyle,
                fontSize: '28px',
                fontWeight: 'bold',
            };
        case 'photo':
            return {
                position: 'absolute',
                top: `${position.top}px`,
                left: `${position.left}px`,
                width: '138px',
                height: '172px',
                objectFit: 'cover',
                cursor: viewOnly ? 'default' : 'pointer',
                outline: !viewOnly && isSelected ? '2px dashed #007bff' : 'none',
                outlineOffset: '2px',
            };
        default:
            return baseTextStyle;
    }
  };

  return (
    <div 
      ref={ref} 
      className="w-[800px] h-[1131px] bg-white relative select-none overflow-hidden flex-shrink-0 certificate-print-container"
      style={{ 
          backgroundImage: `url(${backgroundUrl})`,
          backgroundSize: 'contain', 
          backgroundRepeat: 'no-repeat', 
          backgroundPosition: 'center',
          printColorAdjust: 'exact',
      }}
    >
        <img 
            src={member.photoUrl} 
            alt={member.name} 
            className="absolute object-cover" 
            style={createStyle('photo')}
            onClick={() => onElementSelect('photo')}
            data-selected={selectedElement === 'photo'}
            data-view-only={viewOnly}
        />
        
        <p style={createStyle('name')} onClick={() => onElementSelect('name')} data-selected={selectedElement === 'name'} data-view-only={viewOnly}>
            {member.name.toUpperCase()}
        </p>
        <p style={createStyle('garage')} onClick={() => onElementSelect('garage')} data-selected={selectedElement === 'garage'} data-view-only={viewOnly}>
            {member.garageName.toUpperCase()}
        </p>
        <p style={createStyle('address')} onClick={() => onElementSelect('address')} data-selected={selectedElement === 'address'} data-view-only={viewOnly}>
            {member.address}
        </p>
        
        <p style={createStyle('meta')} onClick={() => onElementSelect('meta')} data-selected={selectedElement === 'meta'} data-view-only={viewOnly}>
            {`Member ID: ${memberId} | Cert No: ${certificateId}`}
        </p>

        <p style={createStyle('issuedDate')} onClick={() => onElementSelect('issuedDate')} data-selected={selectedElement === 'issuedDate'} data-view-only={viewOnly}>
            {issuedDate}
        </p>
        
        <p style={createStyle('expiryDate')} onClick={() => onElementSelect('expiryDate')} data-selected={selectedElement === 'expiryDate'} data-view-only={viewOnly}>
            {expiryDate}
        </p>
    </div>
  );
});
CertificatePreview.displayName = 'CertificatePreview';
