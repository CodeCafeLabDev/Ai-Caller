
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, FileText, MailWarning, UploadCloud, ServerCog, LinkIcon, FileDown } from "lucide-react"; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; 
import type { Metadata } from 'next';

// export const metadata: Metadata = {
//   title: 'Payment Settings - AI Caller',
//   description: 'Configure payment gateway integrations, invoice settings, and billing notifications.',
//   keywords: ['payment gateway', 'stripe', 'razorpay', 'invoice settings', 'billing notifications', 'AI Caller'],
// };

const apiConfigSchema = z.object({
  paymentGateway: z.enum(["stripe", "razorpay"], { required_error: "Please select a payment gateway." }),
  stripeTestPubKey: z.string().optional(),
  stripeTestSecKey: z.string().optional(),
  stripeLivePubKey: z.string().optional(),
  stripeLiveSecKey: z.string().optional(),
  razorpayTestKeyId: z.string().optional(),
  razorpayTestKeySecret: z.string().optional(),
  razorpayLiveKeyId: z.string().optional(),
  razorpayLiveKeySecret: z.string().optional(),
  enableWebhooks: z.boolean().default(false),
  webhookUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
}).refine(data => {
    if (data.enableWebhooks && !data.webhookUrl) return false;
    return true;
}, { message: "Webhook URL is required if webhooks are enabled.", path: ["webhookUrl"] });

const invoiceSettingsSchema = z.object({
  defaultTaxRate: z.coerce.number().min(0).max(100).optional(),
  invoiceSenderEmail: z.string().email({ message: "Invalid email address." }),
  autoGenerateInvoice: z.boolean().default(true),
  autoChargeRecurring: z.boolean().default(false),
  invoiceLogo: z.any().optional(), 
});

const notificationSettingsSchema = z.object({
  enablePaymentSuccessEmail: z.boolean().default(true),
  enablePaymentFailureAlertClient: z.boolean().default(true),
  enableAdminAlertPaymentErrors: z.boolean().default(true),
});

type ApiConfigFormValues = z.infer<typeof apiConfigSchema>;
type InvoiceSettingsFormValues = z.infer<typeof invoiceSettingsSchema>;
type NotificationSettingsFormValues = z.infer<typeof notificationSettingsSchema>;

export default function PaymentSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState("api-config");


  const apiConfigForm = useForm<ApiConfigFormValues>({
    resolver: zodResolver(apiConfigSchema),
    defaultValues: {
      paymentGateway: undefined,
      enableWebhooks: false,
      webhookUrl: "",
    },
  });

  const invoiceSettingsForm = useForm<InvoiceSettingsFormValues>({
    resolver: zodResolver(invoiceSettingsSchema),
    defaultValues: {
      defaultTaxRate: undefined,
      invoiceSenderEmail: "",
      autoGenerateInvoice: true,
      autoChargeRecurring: false,
    },
  });

  const notificationSettingsForm = useForm<NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      enablePaymentSuccessEmail: true,
      enablePaymentFailureAlertClient: true,
      enableAdminAlertPaymentErrors: true,
    },
  });

  const selectedGateway = apiConfigForm.watch("paymentGateway");
  const webhooksEnabled = apiConfigForm.watch("enableWebhooks");

  function onApiConfigSubmit(data: ApiConfigFormValues) {
    console.log("API Config Data:", data);
    toast({
      title: "API Configuration Saved (Simulated)",
      description: `Gateway: ${data.paymentGateway}. Webhooks: ${data.enableWebhooks}.`,
    });
  }
  
  function handleTestConnection() {
    const gateway = apiConfigForm.getValues("paymentGateway");
    if (!gateway) {
        toast({ title: "Cannot Test Connection", description: "Please select a payment gateway first.", variant: "destructive"});
        return;
    }
    toast({
      title: "Test Connection (Simulated)",
      description: `Testing connection for ${gateway}... Connection successful!`,
    });
  }

  function onInvoiceSettingsSubmit(data: InvoiceSettingsFormValues) {
    console.log("Invoice Settings Data:", data);
    toast({
      title: "Invoice Settings Saved (Simulated)",
      description: `Sender Email: ${data.invoiceSenderEmail}. Auto-generate: ${data.autoGenerateInvoice}.`,
    });
  }

  function onNotificationSettingsSubmit(data: NotificationSettingsFormValues) {
    console.log("Notification Settings Data:", data);
    toast({
      title: "Notification Settings Saved (Simulated)",
      description: "Your notification preferences have been updated.",
    });
  }

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    let dataToExport;
    let exportType = "";
    if (activeTab === "api-config") {
        dataToExport = apiConfigForm.getValues();
        exportType = "API Configuration Settings";
    } else if (activeTab === "invoice-settings") {
        dataToExport = invoiceSettingsForm.getValues();
        exportType = "Invoice Settings";
    } else if (activeTab === "notifications") {
        dataToExport = notificationSettingsForm.getValues();
        exportType = "Notification Settings";
    }

    if (dataToExport) {
        toast({
        title: `Exporting as ${format.toUpperCase()} (Simulated)`,
        description: `Preparing ${exportType} for export.`,
        });
        console.log(`Exporting ${format.toUpperCase()} data (${exportType}):`, dataToExport);
    } else {
         toast({ title: "Export Error", description: "No active tab data to export.", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline">Payment Settings</h1>
          <p className="text-muted-foreground">Configure payment gateway, invoice settings, and billing notifications.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" /> Export Settings
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export Options (Active Tab)</DropdownMenuLabel>
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

      <Tabs defaultValue="api-config" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="api-config"><KeyRound className="mr-2 h-4 w-4" />API Configuration</TabsTrigger>
          <TabsTrigger value="invoice-settings"><FileText className="mr-2 h-4 w-4" />Invoice Settings</TabsTrigger>
          <TabsTrigger value="notifications"><MailWarning className="mr-2 h-4 w-4" />Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="api-config" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Gateway Configuration</CardTitle>
              <CardDescription>Connect your preferred payment gateway and manage API keys.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...apiConfigForm}>
                <form onSubmit={apiConfigForm.handleSubmit(onApiConfigSubmit)} className="space-y-8">
                  <FormField
                    control={apiConfigForm.control}
                    name="paymentGateway"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Choose Payment Gateway</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a gateway" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="stripe">Stripe</SelectItem>
                            <SelectItem value="razorpay">Razorpay</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedGateway === "stripe" && (
                    <div className="space-y-4 p-4 border rounded-md">
                      <h4 className="font-semibold text-md">Stripe API Keys</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField control={apiConfigForm.control} name="stripeTestPubKey" render={({ field }) => (
                            <FormItem><FormLabel>Test Publishable Key</FormLabel><FormControl><Input placeholder="pk_test_..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={apiConfigForm.control} name="stripeTestSecKey" render={({ field }) => (
                            <FormItem><FormLabel>Test Secret Key</FormLabel><FormControl><Input type="password" placeholder="sk_test_..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={apiConfigForm.control} name="stripeLivePubKey" render={({ field }) => (
                            <FormItem><FormLabel>Live Publishable Key</FormLabel><FormControl><Input placeholder="pk_live_..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={apiConfigForm.control} name="stripeLiveSecKey" render={({ field }) => (
                            <FormItem><FormLabel>Live Secret Key</FormLabel><FormControl><Input type="password" placeholder="sk_live_..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                    </div>
                  )}

                  {selectedGateway === "razorpay" && (
                     <div className="space-y-4 p-4 border rounded-md">
                      <h4 className="font-semibold text-md">Razorpay API Keys</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                         <FormField control={apiConfigForm.control} name="razorpayTestKeyId" render={({ field }) => (
                            <FormItem><FormLabel>Test Key ID</FormLabel><FormControl><Input placeholder="rzp_test_..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={apiConfigForm.control} name="razorpayTestKeySecret" render={({ field }) => (
                            <FormItem><FormLabel>Test Key Secret</FormLabel><FormControl><Input type="password" placeholder="test_secret_..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={apiConfigForm.control} name="razorpayLiveKeyId" render={({ field }) => (
                            <FormItem><FormLabel>Live Key ID</FormLabel><FormControl><Input placeholder="rzp_live_..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={apiConfigForm.control} name="razorpayLiveKeySecret" render={({ field }) => (
                            <FormItem><FormLabel>Live Key Secret</FormLabel><FormControl><Input type="password" placeholder="live_secret_..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                    </div>
                  )}
                  
                  <FormField
                    control={apiConfigForm.control}
                    name="enableWebhooks"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Webhooks</FormLabel>
                          <FormDescription>Receive real-time notifications about payment events.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )}
                  />
                  {webhooksEnabled && (
                    <FormField control={apiConfigForm.control} name="webhookUrl" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Webhook URL</FormLabel>
                            <FormControl><Input placeholder="https://your-app.com/webhook/gateway" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                  )}

                  <div className="flex space-x-3">
                    <Button type="submit" disabled={!selectedGateway}>Save API Configuration</Button>
                    <Button type="button" variant="outline" onClick={handleTestConnection} disabled={!selectedGateway}>
                        <ServerCog className="mr-2 h-4 w-4" /> Test Connection
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice-settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Customization</CardTitle>
              <CardDescription>Manage how invoices are generated and displayed.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...invoiceSettingsForm}>
                <form onSubmit={invoiceSettingsForm.handleSubmit(onInvoiceSettingsSubmit)} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={invoiceSettingsForm.control} name="defaultTaxRate" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Default Tax Rate (%)</FormLabel>
                            <FormControl><Input type="number" placeholder="e.g., 10 for 10%" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={invoiceSettingsForm.control} name="invoiceSenderEmail" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Invoice Sender Email</FormLabel>
                            <FormControl><Input type="email" placeholder="billing@yourcompany.com" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                  </div>
                  
                  <FormField
                    control={invoiceSettingsForm.control}
                    name="invoiceLogo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Logo</FormLabel>
                        <FormControl>
                            <div className="flex items-center gap-3">
                                <Input id="invoiceLogo" type="file" className="flex-1" onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)} />
                                <Button type="button" variant="outline" size="icon" onClick={() => {/* Clear file or show preview */}}><UploadCloud className="h-4 w-4"/></Button>
                            </div>
                        </FormControl>
                        <FormDescription>Upload your company logo to appear on invoices (max 2MB).</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField control={invoiceSettingsForm.control} name="autoGenerateInvoice" render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Auto-generate Invoice</FormLabel>
                            <FormDescription>Automatically create invoices based on subscription cycles.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                  )} />
                  <FormField control={invoiceSettingsForm.control} name="autoChargeRecurring" render={({ field }) => (
                       <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Auto-charge Recurring Payments</FormLabel>
                            <FormDescription>Attempt to automatically charge saved payment methods for recurring invoices.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                       </FormItem>
                  )} />
                  <Button type="submit">Save Invoice Settings</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing Notifications</CardTitle>
              <CardDescription>Configure automated email notifications for billing events.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationSettingsForm}>
                <form onSubmit={notificationSettingsForm.handleSubmit(onNotificationSettingsSubmit)} className="space-y-6">
                  <FormField control={notificationSettingsForm.control} name="enablePaymentSuccessEmail" render={({ field }) => (
                     <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Payment Success Email to Client</FormLabel>
                            <FormDescription>Send an email to the client upon successful payment.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                     </FormItem>
                  )} />
                   <FormField control={notificationSettingsForm.control} name="enablePaymentFailureAlertClient" render={({ field }) => (
                     <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Payment Failure Alert to Client</FormLabel>
                            <FormDescription>Notify the client if a payment fails.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                     </FormItem>
                  )} />
                  <FormField control={notificationSettingsForm.control} name="enableAdminAlertPaymentErrors" render={({ field }) => (
                     <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Admin Alert on Payment Errors</FormLabel>
                            <FormDescription>Send a notification to admins for critical payment errors.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                     </FormItem>
                  )} />
                  <Button type="submit">Save Notification Settings</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
