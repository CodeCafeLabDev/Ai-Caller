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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetFooter } from "@/components/ui/sheet";
import type { Plan, PlanStatus } from "@/app/(app)/plans-billing/page";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

const planStatusOptions = ["Active", "Draft", "Archived"] as const;

const editPlanFormSchema = z.object({
  name: z.string().min(2, { message: "Plan name must be at least 2 characters." }),
  description: z.string().max(200, { message: "Description must be 200 characters or less." }).optional(),
  priceMonthly: z.string().refine((val) => val === '' || !isNaN(Number(val)), { message: "Monthly price must be a number." }),
  priceAnnual: z.string().refine((val) => val === '' || !isNaN(Number(val)), { message: "Annual price must be a number." }),
  currency: z.string().length(3, { message: "Currency code must be 3 characters (e.g., USD)." }).default("USD"),
  durationDays: z.coerce.number().int().min(1, { message: "Duration must be at least 1 day." }),
  totalCallsAllowedPerMonth: z.string().min(1, { message: "Total calls allowed is required (e.g., '500', 'Unlimited')." }),
  callDurationPerCallMaxMinutes: z.coerce.number().int().min(0, { message: "Max call duration must be a non-negative number." }),
  numberOfAgents: z.coerce.number().int().min(1, { message: "Number of agents must be at least 1." }),
  agentsAllowed: z.coerce.number().int().min(0, { message: "Agents allowed must be a non-negative integer." }),
  voicebotUsageCap: z.string().optional(),
  apiAccess: z.boolean().default(false),
  customAgents: z.boolean().default(false),
  reportingAnalytics: z.boolean().default(true),
  liveCallMonitor: z.boolean().default(false),
  overagesAllowed: z.boolean().default(false),
  overageChargesPer100Calls: z.string().refine((val) => val === '' || !isNaN(Number(val)), { message: "Overage charge must be a number." }),
  trialEligible: z.boolean().default(false),
  status: z.enum(planStatusOptions).default("Draft"),
}).refine(data => !data.overagesAllowed || (data.overagesAllowed && data.overageChargesPer100Calls !== ''), {
  message: "Overage charges are required if overages are allowed.",
  path: ["overageChargesPer100Calls"],
});

type EditPlanFormValues = z.infer<typeof editPlanFormSchema>;

interface EditPlanFormProps {
  plan: Plan;
  onSuccess: (updatedPlan: Plan) => void;
  onCancel: () => void;
}

export function EditPlanForm({ plan, onSuccess, onCancel }: EditPlanFormProps) {
  const router = useRouter();
  const form = useForm<EditPlanFormValues>({
    resolver: zodResolver(editPlanFormSchema),
    defaultValues: {
      name: "",
      description: "",
      priceMonthly: "",
      priceAnnual: "",
      currency: "USD",
      durationDays: 30,
      totalCallsAllowedPerMonth: "",
      callDurationPerCallMaxMinutes: 0,
      numberOfAgents: 1,
      agentsAllowed: 0,
      voicebotUsageCap: "",
      apiAccess: false,
      customAgents: false,
      reportingAnalytics: true,
      liveCallMonitor: false,
      overagesAllowed: false,
      overageChargesPer100Calls: "",
      trialEligible: false,
      status: "Draft" as const,
    }
  });

  React.useEffect(() => {
    // Normalize status to match enum values
    let normalizedStatus = "Draft";
    if (plan.status) {
      const statusMap = {
        active: "Active",
        draft: "Draft",
        archived: "Archived"
      };
      normalizedStatus = statusMap[String(plan.status).toLowerCase()] || "Draft";
    }
    // Convert numeric values to strings for form inputs
    form.reset({
      name: plan.name || "",
      description: plan.description || "",
      priceMonthly: plan.priceMonthly?.toString() || "",
      priceAnnual: plan.priceAnnual?.toString() || "",
      currency: plan.currency || "USD",
      durationDays: plan.durationDays || 30,
      totalCallsAllowedPerMonth: plan.totalCallsAllowedPerMonth || "",
      callDurationPerCallMaxMinutes: plan.callDurationPerCallMaxMinutes || 0,
      numberOfAgents: plan.numberOfAgents || 1,
      agentsAllowed: plan.agentsAllowed || 0,
      voicebotUsageCap: plan.voicebotUsageCap || "",
      apiAccess: plan.apiAccess || false,
      customAgents: plan.customAgents || false,
      reportingAnalytics: plan.reportingAnalytics === undefined ? true : plan.reportingAnalytics,
      liveCallMonitor: plan.liveCallMonitor || false,
      overagesAllowed: plan.overagesAllowed || false,
      overageChargesPer100Calls: plan.overageChargesPer100Calls?.toString() || "",
      trialEligible: plan.trialEligible || false,
      status: normalizedStatus,
    });
  }, [plan, form]);

  const overagesAllowed = form.watch("overagesAllowed");

  async function onSubmit(data: EditPlanFormValues) {
    try {
      // Convert form values to the correct types
      const submittedData: Plan = {
        id: plan.id,
        name: data.name,
        description: data.description || undefined,
        priceMonthly: data.priceMonthly === '' ? undefined : Number(data.priceMonthly),
        priceAnnual: data.priceAnnual === '' ? undefined : Number(data.priceAnnual),
        currency: data.currency,
        durationDays: Number(data.durationDays),
        totalCallsAllowedPerMonth: data.totalCallsAllowedPerMonth,
        callDurationPerCallMaxMinutes: Number(data.callDurationPerCallMaxMinutes),
        numberOfAgents: Number(data.numberOfAgents),
        agentsAllowed: Number(data.agentsAllowed),
        voicebotUsageCap: data.voicebotUsageCap || undefined,
        apiAccess: data.apiAccess,
        customAgents: data.customAgents,
        reportingAnalytics: data.reportingAnalytics,
        liveCallMonitor: data.liveCallMonitor,
        overagesAllowed: data.overagesAllowed,
        overageChargesPer100Calls: data.overageChargesPer100Calls === '' ? undefined : Number(data.overageChargesPer100Calls),
        trialEligible: data.trialEligible,
        status: data.status as PlanStatus,
      };

      console.log("Submitting plan data:", submittedData);
      await onSuccess(submittedData);
    } catch (error) {
      console.error("Update error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update plan",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-4 px-2 py-4 pb-2">
            <h3 className="text-lg font-medium text-foreground border-b pb-2 mb-4">Basic Info</h3>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Premium Plus" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A brief description of the plan..." {...field} className="text-sm" />
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
                    <FormLabel>Monthly Price</FormLabel>
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
                    <FormLabel>Annual Price</FormLabel>
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
                  <FormLabel>Currency Code*</FormLabel>
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
              name="durationDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (in days)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 30 for monthly, 365 for annual" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <h3 className="text-lg font-medium text-foreground border-b pb-2 my-6">Resource Limits</h3>
             <FormField
              control={form.control}
              name="totalCallsAllowedPerMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Calls Allowed / Month*</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., '500', 'Unlimited'" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormDescription>Enter a number or "Unlimited".</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="callDurationPerCallMaxMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Call Duration Per Call (max minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 15" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numberOfAgents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Agents*</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 5" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="agentsAllowed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agents Allowed*</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 20" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="voicebotUsageCap"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voicebot TTS/STT Usage Cap</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., '10 hours', '1M characters'" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <h3 className="text-lg font-medium text-foreground border-b pb-2 my-6">Features Toggle</h3>
             <div className="space-y-3">
                <FormField control={form.control} name="apiAccess" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <FormLabel className="mb-0">API Access</FormLabel>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )} />
                <FormField control={form.control} name="customAgents" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <FormLabel className="mb-0">Custom Agents</FormLabel>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )} />
                <FormField control={form.control} name="reportingAnalytics" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <FormLabel className="mb-0">Reporting & Analytics</FormLabel>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )} />
                <FormField control={form.control} name="liveCallMonitor" render={({ field }) => (
                     <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <FormLabel className="mb-0">Live Call Monitor</FormLabel>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )} />
            </div>

            <h3 className="text-lg font-medium text-foreground border-b pb-2 my-6">Advanced</h3>
             <FormField control={form.control} name="overagesAllowed" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <FormLabel className="mb-0">Overages Allowed</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
            )} />
            {overagesAllowed && (
                 <FormField
                    control={form.control}
                    name="overageChargesPer100Calls"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Overage Charges ($ per 100 calls)</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="e.g., 5" {...field} className="h-9 text-sm" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            )}
            <FormField control={form.control} name="trialEligible" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <FormLabel className="mb-0">Trial Eligible</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
            )} />

            <h3 className="text-lg font-medium text-foreground border-b pb-2 my-6">Status</h3>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select plan status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {planStatusOptions.filter(option => option && option !== "").map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <p className="text-xs text-muted-foreground pt-2">* Required fields</p>
          </div>
        </ScrollArea>
        <div className="px-2 border-t flex justify-end gap-4 bg-background">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving Changes..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

    