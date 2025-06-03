
"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox"; // Added for autoSendLoginEmail
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  trialDuration: z.coerce.number().optional(), // Added for trial duration
  trialCallLimit: z.coerce.number().optional(), // Added for trial call limit
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

type AddClientFormValues = z.infer<typeof addClientFormSchema>;

interface AddClientFormProps {
  onSuccess?: () => void;
}

const availablePlans = ["Basic", "Premium", "Enterprise", "Trial"];

export function AddClientForm({ onSuccess }: AddClientFormProps) {
  const { toast } = useToast();
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
    console.log("New Client Data:", data);
    toast({
      title: "Client Added (Simulated)",
      description: `${data.companyName} has been added successfully.`,
    });
    form.reset();
    if (onSuccess) {
      onSuccess();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Innovate Corp" {...field} />
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
                    <Input type="email" placeholder="contact@innovatecorp.com" {...field} />
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
                    <Input type="tel" placeholder="555-0101" {...field} />
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
                    <Input placeholder="Alice Wonderland" {...field} />
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
                    <Input placeholder="innovate.voxaiomni.com" {...field} />
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
                <FormItem>
                  <FormLabel>Assign Plan</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availablePlans.map(plan => (
                        <SelectItem key={plan} value={plan.toLowerCase()}>{plan}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                        <Input type="number" placeholder="e.g., 14" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)} />
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
                        <Input type="number" placeholder="e.g., 100" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)} />
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
                    <Input type="password" placeholder="••••••••" {...field} />
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
                    <Input type="password" placeholder="••••••••" {...field} />
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
        <div className="pt-4 border-t">
           <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Adding Client..." : "Add Client"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

    