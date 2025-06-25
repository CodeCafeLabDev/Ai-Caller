import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Notifications = () => {
  const [slaBreachAlertsEnabled, setSlaBreachAlertsEnabled] = useState(false);
  const [dailySummaryEnabled, setDailySummaryEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');

  const handleSaveChanges = () => {
    // Handle saving changes
    console.log('Saving Notifications Settings:', {
      slaBreachAlertsEnabled,
      dailySummaryEnabled,
      webhookUrl,
    });
    // Show a toast notification
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Notifications</h2>
      <p className="text-muted-foreground">Configure notification settings for your AI Caller.</p>

      <div className="grid grid-cols-1 gap-6">
        {/* Email & SMS Templates (Placeholder) */}
        <div>
          <Label>Email & SMS Templates</Label>
          <p className="text-muted-foreground text-sm">Manage your email and SMS notification templates.</p>
          {/* You can add links or buttons here to navigate to template management pages/modals */}
          <div className="mt-2">
            <Button variant="outline" onClick={() => console.log('Go to Email Templates')}>Manage Email Templates</Button>
            <Button variant="outline" className="ml-4" onClick={() => console.log('Go to SMS Templates')}>Manage SMS Templates</Button>
          </div>
        </div>

        {/* SLA Breach Alerts Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="slaBreachAlertsEnabled"
            checked={slaBreachAlertsEnabled}
            onCheckedChange={setSlaBreachAlertsEnabled}
          />
          <Label htmlFor="slaBreachAlertsEnabled">Enable SLA Breach Alerts</Label>
        </div>

        {/* Daily Summary Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="dailySummaryEnabled"
            checked={dailySummaryEnabled}
            onCheckedChange={setDailySummaryEnabled}
          />
          <Label htmlFor="dailySummaryEnabled">Enable Daily Summary Notifications</Label>
        </div>

        {/* Webhook URL Input */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="webhookUrl">Webhook URL for Notifications</Label>
          <Input
            id="webhookUrl"
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="Enter webhook URL"
          />
        </div>
      </div>

      {/* Save Changes Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </div>
    </div>
  );
};

export default Notifications;
