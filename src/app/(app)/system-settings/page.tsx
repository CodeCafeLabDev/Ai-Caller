
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Settings - AI Caller',
  description: 'Manage general system configurations, integrations, and security settings for AI Caller.',
  keywords: ['system settings', 'configuration', 'integrations', 'security', 'AI Caller admin'],
};

export default function SystemSettingsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">System Settings</h1>
      <p>This is a placeholder page for System Settings.</p>
      <p>Further development will include features for managing general system configurations, integrations, and security settings.</p>
    </div>
  );
}
