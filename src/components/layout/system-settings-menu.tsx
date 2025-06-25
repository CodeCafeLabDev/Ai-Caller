"use client"; // This is necessary for using useState

import React from 'react';
import { ListFilter, Plug, ShieldCheck, Settings, Bell, BarChart2, Activity, Lock } from 'lucide-react'; // Import icons
import { Button } from '@/components/ui/button'; // Assuming you use Shadcn UI Button

interface SystemSettingsMenuProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const SystemSettingsMenu: React.FC<SystemSettingsMenuProps> = ({ activeSection, setActiveSection }) => {
  const menuItems = [
    { id: 'general', label: 'General', icon: ListFilter },
    { id: 'basic-settings', label: 'Basic Settings', icon: Settings }, // Placeholder icon
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'notifications', label: 'Notifications', icon: Bell }, // Placeholder icon
    { id: 'security-access', label: 'Security & Access', icon: ShieldCheck },
    { id: 'billing-usage', label: 'Billing & Usage', icon: BarChart2 }, // Placeholder icon
    { id: 'logging-monitoring', label: 'Logging Monitoring', icon: Activity },
    { id: 'user-permissions', label: 'User Permissions', icon: Lock },
  ];

  return (
    <div className="flex flex-col space-y-2">
      {menuItems.map((item) => (
        <Button
          key={item.id}
          variant={activeSection === item.id ? 'secondary' : 'ghost'} // Highlight active item
          className="justify-start"
          onClick={() => setActiveSection(item.id)}
        >
          <item.icon className="mr-2 h-4 w-4" />
          {item.label}
        </Button>
      ))}
    </div>
  );
};

export default SystemSettingsMenu;
