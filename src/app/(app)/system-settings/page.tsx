"use client";

import type { Metadata } from 'next'; // You can remove this import if Metadata is no longer used directly in this file
import { useState } from 'react';
import SystemSettingsMenu from '@/components/layout/system-settings-menu';
import GeneralConfigurations from '@/components/system-settings/general-configurations';
import Integrations from '@/components/system-settings/integrations';
import SecuritySettings from '@/components/system-settings/security-settings';
import UserPermissions from '@/components/system-settings/user-permissions';
import Notifications from '@/components/system-settings/notifications';
import LoggingMonitoring from '@/components/system-settings/logging-monitoring';
import BasicSettings from '@/components/system-settings/basic-settings'; // Import BasicSettings
import BillingUsage from '@/components/system-settings/billing-usage'; // Import BillingUsage


export default function SystemSettingsPage() {
  const [activeSection, setActiveSection] = useState('general');

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return <GeneralConfigurations />;
      case 'basic-settings':
        return <BasicSettings />;
      case 'integrations':
        return <Integrations />;
      case 'notifications':
        return <Notifications />;
      case 'user-permissions':
        return <UserPermissions />;
      case 'security-access':
        return <SecuritySettings />;
      case 'billing-usage':
        return <BillingUsage />;
      case 'logging-monitoring':
        return <LoggingMonitoring />;
      default:
        return <div>Select a settings section from the menu.</div>;
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground">Dashboard &gt; Settings</p>
      </div>

      <div className="flex">
        <div className="w-64 mr-8">
          <SystemSettingsMenu activeSection={activeSection} setActiveSection={setActiveSection} />
        </div>

        <div className="flex-1">
          <div className="bg-card rounded-lg shadow-md p-6">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
}
