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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ChevronsUpDown, CalendarIcon, Edit, Tag, Users, FileDown } from "lucide-react"; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; 
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import type { Plan } from "@/app/(app)/plans-billing/page"; 
import type { Metadata } from 'next';
import { exportAsCSV, exportAsExcel, exportAsPDF } from '@/lib/exportUtils';

// export const metadata: Metadata = {
//   title: 'Assign Plan to Client - AI Caller',
//   description: 'Manually link a subscription plan to a client account with optional overrides and discounts.',
//   keywords: ['assign plan', 'client subscription', 'billing management', 'saas billing', 'AI Caller'],
// };

const assignPlanSchema = z.object({
  clientId: z.string({ required_error: "Please select a client." }),
  planId: z.string({ required_error: "Please select a plan." }),
  startDate: z.date().optional(),
  durationOverrideDays: z.coerce.number().int().positive().optional(),
  isTrial: z.boolean().default(false),
  discountType: z.enum(["fixed", "percentage"]).optional(),
  discountValue: z.coerce.number().positive().optional(),
  notes: z.string().optional(),
  autoSendNotifications: z.boolean().default(true),
}).refine(data => {
    if (data.discountType && data.discountValue === undefined) return false; 
    if (!data.discountType && data.discountValue !== undefined) return false; 
    return true;
}, {
    message: "Both discount type and value must be provided if applying a discount.",
    path: ["discountValue"], 
});

type AssignPlanFormValues = z.infer<typeof assignPlanSchema>;

export default function AssignPlanToClientPage() {
  const { toast } = useToast();
  const [clientComboboxOpen, setClientComboboxOpen] = React.useState(false);
  const [planComboboxOpen, setPlanComboboxOpen] = React.useState(false);
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [clients, setClients] = React.useState<{ id: string; companyName: string }[]>([]);

  React.useEffect(() => {
    fetch("http://localhost:5000/api/clients")
      .then(res => res.json())
      .then(data => setClients(data.data || []));
  }, []);

  React.useEffect(() => {
    fetch('http://localhost:5000/api/plans')
      .then(res => res.json())
      .then(data => {
        console.log('Fetched plans:', data.data);
        setPlans(data.data);
      });
  }, []);

  const form = useForm<AssignPlanFormValues>({
    resolver: zodResolver(assignPlanSchema),
    defaultValues: {
      clientId: undefined,
      planId: undefined,
      startDate: new Date(),
      durationOverrideDays: undefined,
      isTrial: false,
      discountType: undefined,
      discountValue: undefined,
      notes: "",
      autoSendNotifications: true,
    },
  });

  const discountType = form.watch("discountType");

  function onSubmit(data: AssignPlanFormValues) {
    fetch('http://localhost:5000/api/assigned-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: data.clientId,
        plan_id: data.planId,
        start_date: data.startDate,
        duration_override_days: data.durationOverrideDays,
        is_trial: data.isTrial,
        discount_type: data.discountType,
        discount_value: data.discountValue,
        notes: data.notes,
        auto_send_notifications: data.autoSendNotifications,
      }),
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          toast({
            title: "Plan Assigned!",
            description: "The plan was successfully assigned to the client.",
          });
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to assign plan.",
            variant: "destructive",
          });
        }
      });
  }

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    const formData = form.getValues();
    const dataArr = [formData];
    if (format === "csv") exportAsCSV(dataArr, 'assign-plan.csv');
    else if (format === "excel") exportAsExcel(dataArr, 'assign-plan.xlsx');
    else if (format === "pdf") exportAsPDF(dataArr, 'assign-plan.pdf');
    toast({
      title: `Exported as ${format.toUpperCase()}`,
      description: `Downloaded current form data.`,
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline">Assign Plan to Client</h1>
          <p className="text-muted-foreground">Manually link a plan to a client with optional overrides.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" /> Export Form Data
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport("csv")}>
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("excel")}>
              Export as Excel (XLSX)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("pdf")}>
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle><Users className="inline-block mr-2 h-5 w-5" />Select Client</CardTitle>
                <CardDescription>Choose the client to assign the plan to.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <Popover open={clientComboboxOpen} onOpenChange={setClientComboboxOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? clients.find(client => String(client.id) === field.value)?.companyName : "Select client..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="Search client..." />
                            <CommandList>
                              <CommandEmpty>No client found.</CommandEmpty>
                              <CommandGroup>
                                {clients.map(client => (
                                  <CommandItem
                                    value={client.companyName}
                                    key={client.id}
                                    onSelect={() => {
                                      form.setValue("clientId", String(client.id));
                                      setClientComboboxOpen(false);
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", client.id === field.value ? "opacity-100" : "opacity-0")} />
                                    {client.companyName}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle><Tag className="inline-block mr-2 h-5 w-5" />Select Plan</CardTitle>
                <CardDescription>Choose the subscription plan to assign.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="planId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <Popover open={planComboboxOpen} onOpenChange={setPlanComboboxOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? plans.find(plan => plan.id === Number(field.value))?.name : "Select plan..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="Search plan..." />
                            <CommandList>
                              <CommandEmpty>No plan found.</CommandEmpty>
                              <CommandGroup>
                                {plans.map(plan => (
                                  <CommandItem
                                    value={plan.name}
                                    key={plan.id}
                                    onSelect={() => {
                                      form.setValue("planId", String(plan.id));
                                      setPlanComboboxOpen(false);
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", plan.id === Number(field.value) ? "opacity-100" : "opacity-0")} />
                                    {plan.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle><Edit className="inline-block mr-2 h-5 w-5" />Assignment Details & Overrides</CardTitle>
              <CardDescription>Customize start date, duration, and trial status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1)) } 
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="durationOverrideDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration Override (Days - Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 45 (overrides plan default)" {...field} />
                      </FormControl>
                      <FormDescription>Leave blank to use plan's default duration.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="isTrial"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Trial Mode</FormLabel>
                      <FormDescription>
                        Activate this plan as a trial for the client.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle>Discount (Optional)</CardTitle>
                <CardDescription>Apply a fixed amount or percentage discount to this assignment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="discountType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Discount Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select discount type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="discountValue"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Discount Value</FormLabel>
                                <FormControl>
                                <Input 
                                    type="number" 
                                    placeholder={discountType === "percentage" ? "e.g., 10 for 10%" : "e.g., 50 for $50"} 
                                    {...field} 
                                    disabled={!discountType}
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
              <CardDescription>Add any relevant notes for this plan assignment (for internal reference).</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Special arrangement for Q3, follow up on..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle>Final Steps & Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="autoSendNotifications"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                        <FormLabel className="text-base">Auto-send Invoice & Email</FormLabel>
                        <FormDescription>
                            Automatically send an invoice and welcome email to the client.
                        </FormDescription>
                        </div>
                        <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                    )}
                />
                <Button type="submit" size="lg" className="w-full md:w-auto">
                    Confirm & Assign Plan
                </Button>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
