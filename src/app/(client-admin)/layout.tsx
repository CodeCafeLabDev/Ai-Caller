
// This layout's functionality has been moved to /client-admin/layout.tsx
// This file should be deleted to avoid routing conflicts.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Client Admin Panel - Deprecated',
  description: 'This layout is deprecated.',
};

export default function DeprecatedClientAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <p>This layout is deprecated and should be removed. Functionality moved to /client-admin/layout.tsx.</p>
      {children}
    </div>
  );
}
