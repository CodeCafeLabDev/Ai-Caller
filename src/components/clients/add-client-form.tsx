
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SheetFooter, SheetClose } from "@/components/ui/sheet";

const addClientFormSchema = z.object({
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  companyEmail: z.string().email({ message: "Invalid company email address." }),
  phoneNumber: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  address: z.string().optional(),
  contactPersonName: z.string().min(2, { message: "Contact person name must be at least 2 characters." }),
  domainSubdomain: z.string().optional(),
  assignedPlan: z.string({ required_error: "Please select a plan." }),
  apiAccess: z.boolean().default(false),
  trialMode: z.boolean().default(false),
  trialDuration: z.coerce.number().optional(), 
  trialCallLimit: z.coerce.number().optional(), 
  adminPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmAdminPassword: z.string(),
  autoSendLoginEmail: z.boolean().default(true),
}).refine(data => data.adminPassword === data.confirmAdminPassword, {
  message: "Passwords don't match",
  path: ["confirmAdminPassword"],
}).refine(data => {
  if (data.trialMode && (data.trialDuration === undefined || data.trialDuration <= 0)) {
    return false;
  }
  return true;
}, {
  message: "Trial duration is required if trial mode is active.",
  path: ["trialDuration"],
}).refine(data => {
  if (data.trialMode && (data.trialCallLimit === undefined || data.trialCallLimit <= 0)) {
    return false;
  }
  return true;
}, {
  message: "Trial call limit is required if trial mode is active.",
  path: ["trialCallLimit"],
});

export type AddClientFormValues = z.infer<typeof addClientFormSchema>;

interface AddClientFormProps {
  onSuccess: (data: AddClientFormValues) => void;
}

const availablePlans = ["Basic", "Premium", "Enterprise", "Trial"];

export function AddClientForm({ onSuccess }: AddClientFormProps) {
  const [planComboboxOpen, setPlanComboboxOpen] = React.useState(false);
  const form = useForm<AddClientFormValues>({
    resolver: zodResolver(addClientFormSchema),
    defaultValues: {
      companyName: "",
      companyEmail: "",
      phoneNumber: "",
      address: "",
      contactPersonName: "",
      domainSubdomain: "",
      assignedPlan: undefined,
      apiAccess: false,
      trialMode: false,
      trialDuration: undefined,
      trialCallLimit: undefined,
      adminPassword: "",
      confirmAdminPassword: "",
      autoSendLoginEmail: true,
    },
  });

  const trialModeEnabled = form.watch("trialMode");

  function onSubmit(data: AddClientFormValues) {
    console.log("New Client Data (from AddClientForm):", data);
    onSuccess(data); // Call parent's success handler which also closes the sheet
    form.reset(); // Reset form for next time
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-4 px-2 py-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Innovate Corp" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contact@innovatecorp.com" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="555-0101" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="123 Main St, Anytown, USA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPersonName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Alice Wonderland" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="domainSubdomain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain/Subdomain (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="innovate.voxaiomni.com" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormDescription>
                    Relevant for multi-tenant setups.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignedPlan"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Assign Plan</FormLabel>
                  <Popover open={planComboboxOpen} onOpenChange={setPlanComboboxOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between h-9 text-sm",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? availablePlans.find(plan => plan.toLowerCase() === field.value)
                            : "Select a plan"}
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
                            {availablePlans.map(plan => (
                              <CommandItem
                                value={plan}
                                key={plan}
                                onSelect={() => {
                                  form.setValue("assignedPlan", plan.toLowerCase());
                                  setPlanComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    plan.toLowerCase() === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {plan}
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

            <FormField
              control={form.control}
              name="apiAccess"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>API Access</FormLabel>
                    <FormDescription>
                      Allow this client to use API features.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trialMode"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Trial Mode</FormLabel>
                    <FormDescription>
                      Enable trial period for this client.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {trialModeEnabled && (
              <>
                <FormField
                  control={form.control}
                  name="trialDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trial Duration (Days)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 14" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)} className="h-9 text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="trialCallLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trial Call Limit</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 100" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)} className="h-9 text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="adminPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmAdminPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Admin Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="autoSendLoginEmail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Auto-send Login Email
                    </FormLabel>
                    <FormDescription>
                      Send login credentials to the client upon creation.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </ScrollArea>
        <SheetFooter className="pt-4 px-2 mt-auto border-t">
            <SheetClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
            </SheetClose>
            <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Adding Client..." : "Add Client"}
            </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}
