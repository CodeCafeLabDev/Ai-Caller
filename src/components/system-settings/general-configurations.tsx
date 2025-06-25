import React, { useState } from 'react';
import { Label } from '@/components/ui/label'; // Assuming Shadcn UI
import { Input } from '@/components/ui/input'; // Assuming Shadcn UI
import { Button } from '@/components/ui/button'; // Assuming Shadcn UI

const GeneralConfigurations = () => {
  const [productName, setProductName] = useState('');
  const [locale, setLocale] = useState('');
  const [timezone, setTimezone] = useState('');
  const [defaultCallerId, setDefaultCallerId] = useState('');
  // State for color picker and logo upload will be more complex

  const handleSaveChanges = () => {
    // Handle saving changes to your backend or state management
    console.log('Saving General Configurations:', {
      productName,
      locale,
      timezone,
      defaultCallerId,
      // Add color picker and logo upload values here
    });
    // Show a toast notification on success or error
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">General Configurations</h2>
      <p className="text-muted-foreground">Configure general system settings for your AI Caller.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Name */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="productName">Product Name</Label>
          <Input
            id="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Enter product name"
          />
        </div>

        {/* System Locale */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="locale">System Locale</Label>
          <Input
            id="locale"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            placeholder="e.g., en-US"
          />
        </div>

        {/* Time Zone */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="timezone">Time Zone</Label>
          <Input
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="e.g., America/New_York"
          />
        </div>

        {/* Default Caller ID */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="defaultCallerId">Default Caller ID</Label>
          <Input
            id="defaultCallerId"
            value={defaultCallerId}
            onChange={(e) => setDefaultCallerId(e.target.value)}
            placeholder="e.g., +18005551212"
          />
        </div>

        {/* Branding Color Picker (Placeholder) */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="brandingColor">Branding Color</Label>
          {/* Implement a color picker component here */}
          <div className="h-10 w-full border rounded-md flex items-center justify-center text-muted-foreground">
            Color Picker Placeholder
          </div>
        </div>

        {/* Logo Upload (Placeholder) */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="logoUpload">Logo Upload</Label>
          {/* Implement a file upload component here */}
          <div className="h-10 w-full border rounded-md flex items-center justify-center text-muted-foreground">
            Logo Upload Placeholder
          </div>
        </div>
      </div>

      {/* Save Changes Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </div>
    </div>
  );
};

export default GeneralConfigurations;
