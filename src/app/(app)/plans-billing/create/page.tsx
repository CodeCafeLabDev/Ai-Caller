
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AddPlanForm } from "@/components/plans/add-plan-form";
import type { Plan } from "@/app/(app)/plans-billing/page";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Removed: import type { Metadata } from 'next';
// Potential Metadata (if this were a server component or handled by layout):
// export const metadata: Metadata = {
//   title: 'Create New Plan - Voxaiomni',
//   description: 'Define and configure a new subscription plan for your services.',
//   keywords: ['create plan', 'new subscription', 'pricing tier setup', 'voxaiomni admin'],
// };

export default function CreatePlanPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleAddPlanSuccess = (newPlan: Plan) => {
    // In a real app, you would likely have a global state or re-fetch plans on the main page.
    // For this simulation, we'll just show a toast and redirect.
    console.log("New Plan Created (from page):", newPlan);
    toast({
      title: "Plan Created Successfully",
      description: `The plan "${newPlan.name}" has been added.`,
    });
    router.push("/plans-billing");
  };

  const handleCancel = () => {
    router.push("/plans-billing");
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
           <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <h1 className="text-3xl font-bold font-headline flex items-center">
                <PlusCircle className="mr-3 h-8 w-8 text-primary" /> Create New Subscription Plan
                </h1>
                <p className="text-muted-foreground">
                Define all the parameters for a new service tier.
                </p>
            </div>
        </div>
      </div>
      
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
            <CardTitle>Plan Configuration</CardTitle>
            <CardDescription>Fill in the details below to set up a new plan. All fields marked with * are required.</CardDescription>
        </CardHeader>
        <CardContent>
             <AddPlanForm 
                onSuccess={handleAddPlanSuccess} 
                onCancel={handleCancel} // Pass the cancel handler
            />
        </CardContent>
      </Card>
    </div>
  );
}
