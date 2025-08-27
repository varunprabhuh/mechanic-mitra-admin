
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Home,
  FilePlus,
  Bell,
  Settings,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Separator } from './ui/separator';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/certificates', label: 'Certificates', icon: ShieldCheck },
  { href: '/update-requests', label: 'Update Requests', icon: Bell },
  { href: '/send-notification', label: 'Send Notification', icon: MessageSquare },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <SidebarMenu>
          {links.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/dashboard')}
                tooltip={link.label}
              >
                <Link href={link.href}>
                  <link.icon />
                  <span>{link.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </div>
      <div className="mb-4">
        <Separator className="my-2"/>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings" isActive={pathname.startsWith('/settings')}>
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </div>
  );
}
