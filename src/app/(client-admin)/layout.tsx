
import type { Metadata } from 'next';
import { ClientAdminSideNavigation } from '@/components/layout/client-admin-side-navigation';
import { SidebarInset } from '@/components/ui/sidebar';
import { ClientAdminHeader } from '@/components/layout/client-admin-header';

export const metadata: Metadata = {
  title: 'Client Admin Panel - Voxaiomni',
  description: 'Manage your Voxaiomni services and account.',
};

export default function ClientAdminAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen w-full">
      <ClientAdminSideNavigation />
      <SidebarInset className="flex flex-1 flex-col bg-muted/40">
        <ClientAdminHeader />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}
