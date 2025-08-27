
'use client';

import * as React from 'react';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/theme-provider';
import { DashboardShell } from '@/components/dashboard-shell';
import type { Metadata } from 'next';


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
       <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=Great+Vibes&family=Tiro+Kannada&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
         <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <React.Suspense fallback={<div>Loading...</div>}>
                <DashboardShell>{children}</DashboardShell>
            </React.Suspense>
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
