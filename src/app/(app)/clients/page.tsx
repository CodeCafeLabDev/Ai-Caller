
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clients Overview - Voxaiomni',
  description: 'Client management section of Voxaiomni. View, add, and manage client accounts.',
  keywords: ['clients', 'customer relationship', 'account management', 'voxaiomni'],
};

export default function ClientsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Clients</h1>
      <p>This is a placeholder page for Clients management.</p>
      <p>Further development will include features like client listing, adding new clients, and viewing client details.</p>
    </div>
  );
}
