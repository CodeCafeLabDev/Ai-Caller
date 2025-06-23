
import type { Metadata } from 'next';
import { SideNavigation } from '@/components/layout/side-navigation';
import { SidebarInset } from '@/components/ui/sidebar';
import { AppHeader } from '@/components/layout/app-header'; // Import the new AppHeader

export const metadata: Metadata = {
  title: 'AI Caller Dashboard',
  description: 'Admin panel for AI Caller',
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen w-full">
      <SideNavigation />
      <SidebarInset className="flex flex-1 flex-col bg-muted/40">
        <AppHeader /> {/* Use the AppHeader component */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}
