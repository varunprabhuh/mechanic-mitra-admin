
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import React, { useEffect } from 'react';
import { Loader2, X, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Member } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { addMember, updateMember, AddMemberPayload } from '@/lib/firebase-actions';
import { parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { DatePicker } from './ui/date-picker';
import { Textarea } from './ui/textarea';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  mobile: z.string().regex(/^\d{10}$/, { message: 'Enter a valid 10-digit mobile number.' }),
  address: z.string().min(10, { message: 'Address is too short.' }),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], { required_error: 'Blood group is required.' }),
  garageName: z.string().min(3, { message: 'Garage name is required.' }),
  photoUrl: z.any().optional(),
  documents: z.object({
    aadhar: z.any().optional(),
    dl: z.any().optional(),
    pan: z.any().optional(),
    ration: z.any().optional(),
  }),
  tags: z.array(z.string()).optional(),
  aadharNumber: z.string().optional(),
  drivingLicenseNumber: z.string().optional(),
  dob: z.date({ required_error: 'Date of birth is required.' }),
  newTag: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type DocKey = 'documents.aadhar' | 'documents.dl' | 'documents.pan' | 'documents.ration';
type DocShortKey = 'aadhar' | 'dl' | 'pan' | 'ration';

type AddMemberFormProps = {
  initialData?: Member;
};

export function AddMemberForm({ initialData }: AddMemberFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(initialData?.photoUrl || null);
  const [docPreviews, setDocPreviews] = React.useState<Record<string, string>>({});
  const [selectedTags, setSelectedTags] = React.useState<string[]>(initialData?.tags || []);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const isEditMode = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      mobile: initialData?.mobile || '',
      address: initialData?.address || '',
      bloodGroup: initialData?.bloodGroup,
      garageName: initialData?.garageName || '',
      photoUrl: initialData?.photoUrl || null,
      documents: {
        aadhar: initialData?.documents?.aadhar || null,
        dl: initialData?.documents?.dl || null,
        pan: initialData?.documents?.pan || null,
        ration: initialData?.documents?.ration || null,
      },
      tags: initialData?.tags || [],
      aadharNumber: initialData?.aadharNumber || '',
      drivingLicenseNumber: initialData?.drivingLicenseNumber || '',
      dob: initialData?.dob ? parseISO(initialData.dob) : undefined,
      newTag: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        mobile: initialData.mobile,
        address: initialData.address,
        bloodGroup: initialData.bloodGroup,
        garageName: initialData.garageName,
        photoUrl: initialData.photoUrl,
        documents: {
            aadhar: initialData.documents?.aadhar || null,
            dl: initialData.documents?.dl || null,
            pan: initialData.documents?.pan || null,
            ration: initialData.documents?.ration || null,
        },
        tags: initialData.tags,
        aadharNumber: initialData.aadharNumber,
        drivingLicenseNumber: initialData.drivingLicenseNumber,
        dob: initialData.dob ? parseISO(initialData.dob) : undefined,
      });
      setSelectedTags(initialData.tags || []);
      setPhotoPreview(initialData.photoUrl);
       const initialDocPreviews: Record<string, string> = {};
        if (initialData.documents?.aadhar) initialDocPreviews['documents.aadhar'] = 'Aadhar Card';
        if (initialData.documents?.dl) initialDocPreviews['documents.dl'] = 'Driving License';
        if (initialData.documents?.pan) initialDocPreviews['documents.pan'] = 'PAN Card';
        if (initialData.documents?.ration) initialDocPreviews['documents.ration'] = 'Ration Card';
        setDocPreviews(initialDocPreviews);
    }
  }, [initialData, form]);

  const convertFileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    let photoUrl: string | null = initialData?.photoUrl || null;
    if (values.photoUrl instanceof File) {
        photoUrl = await convertFileToDataUri(values.photoUrl);
    } else if (typeof values.photoUrl === 'string') {
        photoUrl = values.photoUrl;
    } else {
        photoUrl = null; // Ensure it's null if removed
    }

    const documentPayload: Record<string, string | File> = {};
    for (const key in values.documents) {
        const file = values.documents[key as DocShortKey];
        if (file instanceof File) {
            documentPayload[key] = await convertFileToDataUri(file);
        } else if (typeof file === 'string') {
            documentPayload[key] = file;
        }
    }
    
    try {
      if (isEditMode && initialData) {
        const updatedData = {
          name: values.name,
          mobile: values.mobile,
          address: values.address,
          bloodGroup: values.bloodGroup,
          garageName: values.garageName,
          photoUrl: photoUrl || '',
          documents: documentPayload,
          tags: selectedTags,
          aadharNumber: values.aadharNumber,
          drivingLicenseNumber: values.drivingLicenseNumber,
          dob: values.dob.toISOString(),
        };
        await updateMember(initialData.id, updatedData);
        toast({
          title: "Member Updated Successfully",
          description: `${values.name}'s details have been updated.`,
        });
        router.push('/members');
      } else {
        const newMemberPayload: AddMemberPayload = {
          name: values.name,
          mobile: values.mobile,
          address: values.address,
          bloodGroup: values.bloodGroup,
          garageName: values.garageName,
          photoUrl: photoUrl || 'https://placehold.co/100x100.png',
          documents: documentPayload,
          tags: selectedTags,
          aadharNumber: values.aadharNumber,
          drivingLicenseNumber: values.drivingLicenseNumber,
          dob: values.dob.toISOString(),
        };
        await addMember(newMemberPayload);

        toast({
          title: "Member Added Successfully",
          description: `${values.name} has been added.`,
        });

        form.reset();
        setPhotoPreview(null);
        setSelectedTags([]);
        router.push('/members');
      }
    } catch (error) {
       toast({
        title: "Operation Failed",
        description: `An error occurred: ${error instanceof Error ? error.message : "An unexpected response was received from the server."}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('photoUrl', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: DocKey) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue(fieldName, file);
      setDocPreviews(prev => ({ ...prev, [fieldName]: file.name }));
    }
  };

  const handleRemovePhoto = () => {
    form.setValue('photoUrl', null);
    setPhotoPreview(null);
  };
  
  const handleRemoveDoc = (fieldName: DocKey) => {
    form.setValue(fieldName, null);
    setDocPreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[fieldName];
        return newPreviews;
    });
  };

  const handleAddTag = () => {
    const newTag = form.getValues('newTag')?.trim();
    if (newTag && !selectedTags.includes(newTag)) {
      const newTags = [...selectedTags, newTag];
      setSelectedTags(newTags);
      form.setValue('tags', newTags);
      form.setValue('newTag', '');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newTags);
    form.setValue('tags', newTags);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Member Details</CardTitle>
                <CardDescription>Enter the personal and contact information for the new member.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="e.g. Suresh Kumar" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl><Input placeholder="e.g. 9876543210" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bloodGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Group</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                              <SelectItem key={group} value={group}>{group}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                      control={form.control}
                      name="garageName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Garage Name</FormLabel>
                          <FormControl><Input placeholder="e.g. Suresh Auto Works" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dob"
                      render={({ field }) => (
                        <FormItem className="flex flex-col pt-2">
                          <FormLabel>Date of Birth</FormLabel>
                          <DatePicker
                            date={field.value}
                            setDate={field.onChange}
                            placeholder="Select DOB"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="aadharNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aadhar Number (Optional)</FormLabel>
                          <FormControl><Input placeholder="e.g. 1234 5678 9012" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="drivingLicenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Driving License (Optional)</FormLabel>
                          <FormControl><Input placeholder="e.g. KA01 20230012345" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl><Textarea placeholder="e.g. 123, Main Street, Bangalore" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Member Documents</CardTitle>
                <CardDescription>Upload supporting documents for verification. New uploads will replace existing documents if any.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['aadhar', 'dl', 'pan', 'ration'] as const).map(docType => {
                   const fieldName: DocKey = `documents.${docType}`;
                   const docLabel = docType === 'dl' ? 'Driving License' : docType === 'pan' ? 'PAN Card' : `${docType.charAt(0).toUpperCase() + docType.slice(1)} Card`;
                   return (
                      <FormField
                        key={docType}
                        control={form.control}
                        name={fieldName}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{docLabel}</FormLabel>
                            <div className="flex items-center gap-2">
                                <FormLabel htmlFor={`doc-${docType}`} className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Choose File
                                </FormLabel>
                                 <FormControl>
                                    <Input
                                        id={`doc-${docType}`}
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => handleDocChange(e, fieldName)}
                                        ref={field.ref}
                                    />
                                </FormControl>
                                {docPreviews[fieldName] && (
                                   <div className="flex items-center gap-1 text-sm text-muted-foreground truncate">
                                      <span className="truncate">{docPreviews[fieldName]}</span>
                                      <button type="button" onClick={() => handleRemoveDoc(fieldName)} className="p-0.5 rounded-full hover:bg-muted-foreground/20">
                                         <X className="h-3 w-3" />
                                         <span className="sr-only">Remove {docType}</span>
                                      </button>
                                   </div>
                                )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                   )
                })}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Member Photo</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                 <div className="relative group">
                    <Avatar className="w-32 h-32">
                      <AvatarImage src={photoPreview || undefined} data-ai-hint="person portrait" />
                      <AvatarFallback className="text-3xl">MM</AvatarFallback>
                    </Avatar>
                    {photoPreview && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="destructive" size="icon" type="button" onClick={handleRemovePhoto}>
                                <X className="h-5 w-5"/>
                                <span className="sr-only">Remove photo</span>
                            </Button>
                        </div>
                    )}
                 </div>
                 <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel htmlFor="photo-upload" className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer w-full")}>
                           <Upload className="mr-2 h-4 w-4" />
                           {photoPreview ? 'Change Photo' : 'Upload Photo'}
                        </FormLabel>
                       <FormControl>
                           <Input id="photo-upload" className="hidden" type="file" accept="image/*" onChange={handlePhotoChange} ref={field.ref}/>
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Member Tags</CardTitle>
                <CardDescription>Categorize members by skills and specialties for easier filtering.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center gap-2">
                    <FormField
                        control={form.control}
                        name="newTag"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel className="sr-only">New Tag</FormLabel>
                                <FormControl>
                                    <Input placeholder="Add a new tag" {...field} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag();}}} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <Button type="button" onClick={handleAddTag}>Add</Button>
                </div>
                
                <div className="space-y-2">
                   <FormLabel>Selected Tags</FormLabel>
                    {selectedTags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.map(tag => (
                          <Badge key={tag} variant="default">
                            {tag}
                            <button type="button" onClick={() => removeTag(tag)} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                               <X className="h-3 w-3 text-primary-foreground hover:text-white" />
                               <span className="sr-only">Remove {tag}</span>
                            </button>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No tags selected. Add them manually above.</p>
                    )}
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push('/members')}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Update Member' : 'Create Member'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
