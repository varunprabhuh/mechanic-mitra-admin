
'use client';

import * as React from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Loader2, Edit, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAdminProfile, updateAdminProfile } from '@/lib/firebase-actions';
import type { AdminProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function AccountSettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);
  const [profile, setProfile] = React.useState<AdminProfile | null>(null);
  const [originalProfile, setOriginalProfile] = React.useState<AdminProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const [newPhotoFile, setNewPhotoFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            setCurrentUser(user);
        } else {
            setCurrentUser(null);
            router.push('/');
        }
    });
    return () => unsubscribe();
  }, [router]);

  React.useEffect(() => {
    async function fetchProfile(uid: string) {
      setLoading(true);
      try {
        const adminProfile = await getAdminProfile(uid);
        const initialProfile: AdminProfile = adminProfile || { uid, name: 'Admin', photoUrl: '', phone: '', address: '' };
        setProfile(initialProfile);
        setOriginalProfile(initialProfile);
        setPhotoPreview(initialProfile.photoUrl);
      } catch (error) {
        console.error("Failed to fetch admin profile:", error);
        toast({
            title: "Error",
            description: "Could not load admin profile.",
            variant: "destructive"
        })
      } finally {
        setLoading(false);
      }
    }

    if (currentUser) {
        fetchProfile(currentUser.uid);
    }
  }, [currentUser, toast]);
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setProfile(prev => prev ? { ...prev, [id]: value } : null);
  };
  
  const convertFileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSaveChanges = async () => {
    if (!profile || !currentUser) return;
    setSaving(true);
    
    let photoUrl = profile.photoUrl;
    if (newPhotoFile) {
        photoUrl = await convertFileToDataUri(newPhotoFile);
    }

    try {
      const updatedData = {
        name: profile.name,
        phone: profile.phone || '',
        address: profile.address || '',
        photoUrl: photoUrl || '',
      };
      await updateAdminProfile(currentUser.uid, updatedData);
      const newProfileData: AdminProfile = { ...profile, ...updatedData };
      setProfile(newProfileData);
      setOriginalProfile(newProfileData);
      setIsEditing(false);
      setNewPhotoFile(null);
      
      window.dispatchEvent(new Event('admin-profile-updated'));

      toast({
        title: 'Changes Saved',
        description: 'Your account information has been updated.',
      });
    } catch (error) {
       toast({
        title: 'Save Failed',
        description: 'Could not save your changes. Please try again.',
        variant: "destructive"
      });
    } finally {
        setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setProfile(originalProfile);
    setPhotoPreview(originalProfile?.photoUrl || null);
    setNewPhotoFile(null);
    setIsEditing(false);
  }
  
  if (loading) {
    return (
        <div className="py-8">
             <div className="mb-8">
                <Skeleton className="h-9 w-48 mb-2" />
                <Skeleton className="h-4 w-72" />
            </div>
            <Card>
                <CardHeader>
                   <Skeleton className="h-6 w-40 mb-2" />
                   <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="flex flex-col gap-2">
                           <Skeleton className="h-10 w-48" />
                           <Skeleton className="h-3 w-32" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
                 <CardFooter>
                    <Skeleton className="h-10 w-32" />
                </CardFooter>
            </Card>
        </div>
    )
  }
  
  if (!currentUser) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Admin Account</h1>
        <p className="text-muted-foreground">
          View and edit your administrator profile details.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>
            {isEditing ? 'Update your name, profile picture, and other personal details.' : 'Your current administrator profile.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={photoPreview || undefined} alt="Admin" className="object-cover" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
               {isEditing && (
                 <>
                  <Label htmlFor="photo-upload" className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}>
                     <Upload className="mr-2 h-4 w-4" />
                     Upload New Photo
                  </Label>
                 <input id="photo-upload" className="hidden" type="file" accept="image/*" onChange={handlePhotoChange} />
                 <p className="text-xs text-muted-foreground">Recommended size: 200x200px</p>
                </>
               )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Admin Name</Label>
            {isEditing ? (
              <Input id="name" value={profile?.name || ''} onChange={handleInputChange} />
            ) : (
              <p className="text-base font-medium h-10 flex items-center px-3 rounded-md border border-input bg-muted/50">{profile?.name || 'Not set'}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
             {isEditing ? (
                <Input id="phone" type="tel" placeholder="e.g., +91 98765 43210" value={profile?.phone || ''} onChange={handleInputChange}/>
             ) : (
                <p className="text-base font-medium h-10 flex items-center px-3 rounded-md border border-input bg-muted/50">{profile?.phone || 'Not set'}</p>
             )}
          </div>
           <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
             {isEditing ? (
                <Input id="address" placeholder="e.g., 123 Admin Lane, Tech City" value={profile?.address || ''} onChange={handleInputChange}/>
             ) : (
                <p className="text-base font-medium h-10 flex items-center px-3 rounded-md border border-input bg-muted/50">{profile?.address || 'Not set'}</p>
             )}
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          {isEditing ? (
            <>
                <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                </Button>
                <Button onClick={handleSaveChanges} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
