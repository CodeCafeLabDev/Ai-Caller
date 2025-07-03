import React from 'react';
import { Badge } from '@/components/ui/badge'; // Assuming Shadcn UI Badge
import { Button } from '@/components/ui/button'; // Assuming Shadcn UI Button
import { Switch } from '@/components/ui/switch';

interface IntegrationCardProps {
  name: string;
  status: 'Connected' | 'Not Connected';
  onConfigure?: () => void;
  switchChecked?: boolean;
  onSwitchChange?: (checked: boolean) => void;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({ name, status, onConfigure, switchChecked, onSwitchChange }) => {
  const isConnected = status === 'Connected';

  return (
    <div className="bg-card rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700"> {/* Material-style card */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">{name}</h3>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? 'default' : 'destructive'}>{status}</Badge>
          {typeof switchChecked === 'boolean' && onSwitchChange && (
            <Switch checked={switchChecked} onCheckedChange={onSwitchChange} />
          )}
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onConfigure} disabled={!onConfigure}>
          Configure
        </Button>
      </div>
    </div>
  );
};

export default IntegrationCard;