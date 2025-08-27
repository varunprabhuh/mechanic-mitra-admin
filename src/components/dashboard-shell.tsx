
'use client';
import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { DashboardNav } from '@/components/dashboard-nav';
import { Search, PlusCircle, User, LogOut, Settings, Bell, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useRequests } from '@/hooks/use-requests';
import { Badge } from '@/components/ui/badge';
import { getAdminProfile } from '@/lib/firebase-actions';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = React.useState(searchParams.get('q') || '');
  const { toast } = useToast();
  const { requests } = useRequests();
  
  const [adminName, setAdminName] = React.useState('Admin');
  const [adminEmail, setAdminEmail] = React.useState('loading...');
  const [adminPhotoUrl, setAdminPhotoUrl] = React.useState('/logo/setting-badge.png');
  const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const pendingRequestsCount = requests.length;
  
  const fetchAdminProfile = React.useCallback(async (uid: string) => {
    try {
      const profile = await getAdminProfile(uid);
      if (profile) {
        setAdminName(profile.name || 'Admin');
        setAdminPhotoUrl(profile.photoUrl || '/logo/setting-badge.png');
      }
    } catch (error) {
      console.error("Could not fetch admin profile", error);
      toast({
            title: "Could not load profile",
            description: "There was an issue fetching the admin profile details.",
            variant: "destructive"
      });
    }
  }, [toast]);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setAdminEmail(user.email || 'Not available');
      } else {
        // If we are not on the login page and there is no user, redirect to login.
        if(pathname !== '/') {
            router.push('/');
        }
      }
      setIsLoading(false);
    });
     return () => unsubscribe();
  }, [router, pathname]);

  React.useEffect(() => {
    if (currentUser) {
        fetchAdminProfile(currentUser.uid);
    }
    
    const handleProfileUpdate = () => {
        if(currentUser) {
            fetchAdminProfile(currentUser.uid);
        }
    };
    
    window.addEventListener('admin-profile-updated', handleProfileUpdate);

    return () => {
        window.removeEventListener('admin-profile-updated', handleProfileUpdate);
    };

  }, [currentUser, fetchAdminProfile]);


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchValue(query);
    if (pathname !== '/members') {
        router.push(`/members?q=${query}`);
    } else {
        const newParams = new URLSearchParams(searchParams.toString());
        if (query) {
            newParams.set('q', query);
        } else {
            newParams.delete('q');
        }
        router.replace(`/members?${newParams.toString()}`, { scroll: false });
    }
  };
  
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pathname !== '/members') {
        router.push(`/members?q=${searchValue}`);
    }
  };


  React.useEffect(() => {
    setSearchValue(searchParams.get('q') || '');
  }, [searchParams]);

  const handleLogout = () => {
    auth.signOut();
    toast({
      title: "Logged Out Successfully",
      description: "You have been logged out of your account.",
    });
    router.push('/');
  };

  // Do not render the shell for the login page
  if (pathname === '/') {
    return <>{children}</>;
  }
  
  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon" className="border-r">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Image src="/certificate/logo.png" width={48} height={48} alt="Mechanic Mitra Logo" className="object-contain" />
            <div className="flex flex-col">
                <span className="text-sm font-semibold leading-tight text-sidebar-foreground">Mechanic Mitra Central</span>
                <span className="text-xs text-sidebar-foreground/80">Reg.No.: DRB4/SOR/250/2021-2022</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <DashboardNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger className="sm:hidden" />
          <div className="relative ml-auto flex-1 md:grow-0">
            <form onSubmit={handleSearchSubmit}>
              <Input
                type="search"
                name="search"
                placeholder="Search members..."
                className="w-full rounded-lg bg-card pl-8 md:w-[200px] lg:w-[320px]"
                value={searchValue}
                onChange={handleSearchChange}
              />
            </form>
          </div>
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="relative">
                  <Image
                      src={adminPhotoUrl}
                      width={32}
                      height={32}
                      alt="Admin Avatar"
                      className="rounded-full cursor-pointer object-cover"
                  />
                  {pendingRequestsCount > 0 && (
                     <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{pendingRequestsCount}</Badge>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/settings/account" className="focus:bg-transparent focus:text-accent-foreground cursor-pointer">
                    <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{adminName}</p>
                            <p className="text-xs leading-none text-muted-foreground">{adminEmail}</p>
                        </div>
                    </DropdownMenuLabel>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                       <Link href="/members/new"><PlusCircle className="mr-2 h-4 w-4" />New Member</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                       <Link href="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                       <Link href="/update-requests">
                        <div className="flex items-center">
                            <Bell className="mr-2 h-4 w-4" />
                            <span>Update Requests</span>
                            {pendingRequestsCount > 0 && (
                               <Badge variant="destructive" className="ml-auto">{pendingRequestsCount}</Badge>
                            )}
                        </div>
                       </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                    <DropdownMenuItem>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                <AlertDialogDescription>
                    You will be returned to the login screen.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
           </AlertDialog>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
