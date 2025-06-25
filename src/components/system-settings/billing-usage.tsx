import React from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge'; // Assuming Shadcn UI Badge
import { Progress } from '@/components/ui/progress'; // Assuming Shadcn UI Progress
import { Button } from '@/components/ui/button';

const BillingUsage = () => {
  // Placeholder data for current plan and usage (replace with actual data)
  const currentPlan = 'Pro';
  const minutesUsed = 1250;
  const monthlyQuota = 2000;
  const usagePercentage = (minutesUsed / monthlyQuota) * 100;

  const handleUpgradePlan = () => {
    // Handle navigation to the upgrade plan page or modal
    console.log('Navigate to Upgrade Plan');
    // You would typically use your router (e.g., Next.js router) to navigate
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Billing & Usage</h2>
      <p className="text-muted-foreground">View your current plan and usage details.</p>

      <div className="grid grid-cols-1 gap-6">
        {/* Current Plan Badge */}
        <div>
          <Label>Current Plan</Label>
          <div className="mt-1">
            {/* Use Badge component to display the current plan */}
            <Badge variant="secondary">{currentPlan}</Badge>
          </div>
        </div>

        {/* Usage Meter */}
        <div>
          <Label>Monthly Call Usage</Label>
          <p className="text-muted-foreground text-sm">
            {minutesUsed} out of {monthlyQuota} minutes used this month.
          </p>
          {/* Use Progress component for the usage meter */}
          <div className="mt-2">
            <Progress value={usagePercentage} className="w-[60%]" /> {/* Adjust width as needed */}
          </div>
        </div>

        {/* Upgrade Plan CTA */}
        <div>
          <Label>Need More Capacity?</Label>
          <p className="text-muted-foreground text-sm">
            Upgrade your plan to increase your monthly call quota and access more features.
          </p>
          <Button className="mt-2" onClick={handleUpgradePlan}>Upgrade Plan</Button>
        </div>
      </div>
    </div>
  );
};

export default BillingUsage;
