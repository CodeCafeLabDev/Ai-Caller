import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea'; // Assuming Shadcn UI Textarea
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast'; // Assuming Shadcn UI Toast

const SecuritySettings = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [allowedIpList, setAllowedIpList] = useState('');
  const { toast } = useToast(); // Hook for toast notifications

  const handleSaveChanges = () => {
    // Handle saving changes
    console.log('Saving Security Settings:', {
      twoFactorEnabled,
      allowedIpList,
    });
    // Show a toast notification
    toast({
      title: "Settings Saved",
      description: "Security settings have been updated.",
    });
  };

  const handleRotateApiKey = () => {
    // Handle API key rotation logic
    console.log('Rotating API Key');
    // Implement API call to rotate the key
    // Show a toast notification on success or error
    toast({
      title: "API Key Rotated",
      description: "Your API key has been successfully rotated.",
    });
  };

  const handleDownloadAuditLog = () => {
    // Handle audit log download logic
    console.log('Downloading Audit Log');
    // Implement logic to generate and download the audit log file
    // Show a toast notification or provide a download link
    toast({
      title: "Download Started",
      description: "Your audit log download is starting.",
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Security & Access</h2>
      <p className="text-muted-foreground">Manage security settings and access control for your AI Caller.</p>

      <div className="grid grid-cols-1 gap-6">
        {/* 2FA Switch */}
        <div className="flex items-center space-x-2">
          <Switch
            id="twoFactorEnabled"
            checked={twoFactorEnabled}
            onCheckedChange={setTwoFactorEnabled}
          />
          <Label htmlFor="twoFactorEnabled">Enable Two-Factor Authentication (2FA)</Label>
        </div>

        {/* Allowed IP List */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="allowedIpList">Allowed IP Addresses</Label>
          <Textarea
            id="allowedIpList"
            value={allowedIpList}
            onChange={(e) => setAllowedIpList(e.target.value)}
            placeholder="Enter allowed IP addresses, one per line"
            rows={5}
          />
          <p className="text-muted-foreground text-sm">
            Enter IP addresses that are allowed to access the API, one per line. Leave empty to allow all.
          </p>
        </div>

        {/* API Key Rotate Button */}
        <div>
          <Label>API Key Management</Label>
          <p className="text-muted-foreground text-sm">Rotate your API key to enhance security.</p>
          <Button variant="outline" className="mt-2" onClick={handleRotateApiKey}>Rotate API Key</Button>
        </div>

        {/* Audit-log Download Button */}
        <div>
          <Label>Audit Log</Label>
          <p className="text-muted-foreground text-sm">Download the system audit log for review.</p>
          <Button variant="outline" className="mt-2" onClick={handleDownloadAuditLog}>Download Audit Log</Button>
        </div>
      </div>

      {/* Save Changes Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </div>
    </div>
  );
};

export default SecuritySettings;
