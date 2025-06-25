import React from 'react';
import { Badge } from '@/components/ui/badge'; // Assuming Shadcn UI Badge
import { Button } from '@/components/ui/button'; // Assuming Shadcn UI Button

interface IntegrationCardProps {
  name: string;
  status: 'Connected' | 'Not Connected';
  onConfigure?: () => void;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({ name, status, onConfigure }) => {
  const isConnected = status === 'Connected';

  return (
    <div className="bg-card rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700"> {/* Material-style card */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">{name}</h3>
        <Badge variant={isConnected ? 'default' : 'destructive'}>{status}</Badge>
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