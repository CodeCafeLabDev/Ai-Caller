
import type { Metadata } from 'next';
import { ClientAdminSideNavigation } from '@/components/layout/client-admin-side-navigation';
import { SidebarInset } from '@/components/ui/sidebar';
import { ClientAdminHeader } from '@/components/layout/client-admin-header';
import { AuthGuard } from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'Client Admin Panel - AI Caller',
  description: 'Manage your AI Caller services and account.',
};

export default function ClientAdminAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard requireAuth={true} allowedTypes={['client']}>
      <div className="flex min-h-screen w-full">
        <ClientAdminSideNavigation />
        <SidebarInset className="flex flex-1 flex-col bg-muted/40">
          <ClientAdminHeader />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </AuthGuard>
  );
}
