import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UserProvider } from '@/lib/utils';
import { UserHydrator } from '@/components/UserHydrator';

export const metadata: Metadata = {
  title: 'AI Caller',
  description: 'Welcome to AI Caller',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <UserProvider>
          <UserHydrator>
            <SidebarProvider defaultOpen={true}>
              {children}
            </SidebarProvider>
          </UserHydrator>
        </UserProvider>
        <Toaster />
      </body>
    </html>
  );
}
