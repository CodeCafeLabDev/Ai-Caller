
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clients Overview | Admin - Voxaiomni',
  description: 'Client management section of Voxaiomni. View, add, and manage client accounts, statuses, and users.',
  keywords: ['clients', 'customer relationship', 'account management', 'client users', 'client status', 'voxaiomni admin'],
};

export default function ClientsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Clients Overview</h1>
      <p>This section provides tools for managing client accounts, their users, and billing information.</p>
      <p>Use the sub-navigation to access specific client management features like listing all clients, managing account statuses, or handling client users.</p>
    </div>
  );
}
