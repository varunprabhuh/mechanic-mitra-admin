
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { Mail, Phone, MessageSquare, User, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function SettingsPage() {
  const { setTheme } = useTheme();

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground">
          Manage application settings and view developer information.
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize the look and feel of the application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select defaultValue="system" onValueChange={(value) => setTheme(value)}>
                <SelectTrigger id="theme" className="w-[280px]">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Developed by</CardTitle>
            <CardDescription>
              This application was crafted with care by the developer below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src="/developer-avatar.png" alt="Varun Prabhu H" />
                    <AvatarFallback>VP</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <p className="font-semibold text-lg">VARUN PRABHU H</p>
                    <p className="text-sm text-muted-foreground">B.E, M.Tech in CSE</p>
                </div>
            </div>
            <div className="space-y-2 pt-2">
               <Button variant="outline" asChild className="w-full justify-start">
                   <Link href="mailto:varunprabhu18@gmail.com">
                       <Mail className="mr-2 h-4 w-4" />
                       varunprabhu18@gmail.com
                   </Link>
               </Button>
               <Button variant="outline" asChild className="w-full justify-start">
                   <Link href="tel:+918892887848">
                       <Phone className="mr-2 h-4 w-4" />
                       +91-8892887848
                   </Link>
               </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Contact President</CardTitle>
                <CardDescription>
                    Contact details for the Mechanic Mitra association president.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarFallback>N</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <p className="font-semibold text-lg flex items-center gap-2"><User className="h-5 w-5 text-muted-foreground" /> Nagesh</p>
                    </div>
                </div>
                <div className="space-y-2 pt-2">
                    <div className="flex items-start gap-3 rounded-md border p-3">
                         <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                         <div>
                            <p className="font-medium">Address</p>
                            <p className="text-muted-foreground text-sm">#1008, 3rd 'A' main road, 'E' Block, 2nd stage, Rajajinagar, Bengaluru 560-010.</p>
                         </div>
                    </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button variant="outline" asChild className="w-full justify-start">
                           <Link href="tel:+919980437239">
                               <Phone className="mr-2 h-4 w-4" />
                               Call (+91-9980437239)
                           </Link>
                       </Button>
                        <Button variant="outline" asChild className="w-full justify-start">
                           <Link href="https://wa.me/919980437239" target="_blank">
                               <MessageSquare className="mr-2 h-4 w-4" />
                               WhatsApp
                           </Link>
                       </Button>
                   </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
