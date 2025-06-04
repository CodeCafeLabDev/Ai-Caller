
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetFooter } from "@/components/ui/sheet"; // Removed SheetClose as it's handled by onCancel
import type { Plan } from "@/app/(app)/plans-billing/page"; // Import Plan type

const planStatusOptions = ["Active", "Draft", "Archived"] as const;
const planDurationOptions = ["Monthly", "Annual", "Custom"] as const;

const editPlanFormSchema = z.object({
  name: z.string().min(2, { message: "Plan name must be at least 2 characters." }),
  priceMonthly: z.coerce.number().positive({ message: "Monthly price must be positive." }).optional().or(z.literal('')),
  priceAnnual: z.coerce.number().positive({ message: "Annual price must be positive." }).optional().or(z.literal('')),
  currency: z.string().length(3, { message: "Currency code must be 3 characters (e.g., USD)." }).default("USD"),
  callMinuteLimit: z.string().min(1, { message: "Call/Minute limit is required (e.g., '500 calls', '1000 mins', 'Unlimited')." }),
  templateUsageLimit: z.coerce.number().int().min(0, { message: "Template limit must be a non-negative integer." }),
  durationDisplay: z.enum(planDurationOptions, { required_error: "Please select a plan duration." }),
  agentSeats: z.coerce.number().int().min(1, { message: "Agent seats must be at least 1." }),
  status: z.enum(planStatusOptions).default("Draft"),
});

type EditPlanFormValues = z.infer<typeof editPlanFormSchema>;

interface EditPlanFormProps {
  plan: Plan;
  onSuccess: (updatedPlan: Plan) => void; // Changed to pass updatedPlan
  onCancel: () => void;
}

export function EditPlanForm({ plan, onSuccess, onCancel }: EditPlanFormProps) {
  const form = useForm<EditPlanFormValues>({
    resolver: zodResolver(editPlanFormSchema),
    defaultValues: {
      name: plan.name || "",
      priceMonthly: plan.priceMonthly || undefined,
      priceAnnual: plan.priceAnnual || undefined,
      currency: plan.currency || "USD",
      callMinuteLimit: plan.callMinuteLimit || "",
      templateUsageLimit: plan.templateUsageLimit || 0,
      durationDisplay: plan.durationDisplay || undefined,
      agentSeats: plan.agentSeats || 1,
      status: plan.status || "Draft",
    },
  });

  React.useEffect(() => {
    form.reset({
      name: plan.name || "",
      priceMonthly: plan.priceMonthly || undefined,
      priceAnnual: plan.priceAnnual || undefined,
      currency: plan.currency || "USD",
      callMinuteLimit: plan.callMinuteLimit || "",
      templateUsageLimit: plan.templateUsageLimit || 0,
      durationDisplay: plan.durationDisplay || undefined,
      agentSeats: plan.agentSeats || 1,
      status: plan.status || "Draft",
    });
  }, [plan, form]);

  function onSubmit(data: EditPlanFormValues) {
    const submittedData = {
      ...data,
      priceMonthly: data.priceMonthly === '' ? undefined : data.priceMonthly,
      priceAnnual: data.priceAnnual === '' ? undefined : data.priceAnnual,
    };
    const updatedPlanObject: Plan = {
      id: plan.id, 
      name: submittedData.name,
      priceMonthly: submittedData.priceMonthly,
      priceAnnual: submittedData.priceAnnual,
      currency: submittedData.currency,
      callMinuteLimit: submittedData.callMinuteLimit,
      templateUsageLimit: submittedData.templateUsageLimit,
      durationDisplay: submittedData.durationDisplay,
      agentSeats: submittedData.agentSeats,
      status: submittedData.status,
    };
    console.log("Updated Plan Data (Simulated):", updatedPlanObject);
    onSuccess(updatedPlanObject); // Pass the updated plan object
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-4 px-2 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Premium Plus" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priceMonthly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Price (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 99" {...field} className="h-9 text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priceAnnual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Price (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 990" {...field} className="h-9 text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency Code</FormLabel>
                  <FormControl>
                    <Input placeholder="USD" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormDescription>Enter a 3-letter currency code (e.g., USD, EUR).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="callMinuteLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Call/Minute Limit</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., '1000 mins' or 'Unlimited'" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormDescription>Specify limits like "500 calls", "10000 mins", or "Unlimited".</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="templateUsageLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Usage Limit</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 20" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="durationDisplay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select plan duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {planDurationOptions.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agentSeats"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agent Seats</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 5" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select plan status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {planStatusOptions.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ScrollArea>
        <SheetFooter className="pt-4 px-2 mt-auto border-t">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving Changes..." : "Save Changes"}
            </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}

    