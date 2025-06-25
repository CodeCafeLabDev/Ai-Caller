
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowRightLeft, PlusCircle, MoreHorizontal, Edit, Trash2, Play, Pause, KeyRound, Copy, Eye, EyeOff, RotateCcw, ListChecks, Sparkles } from "lucide-react";
import type { Metadata } from 'next';

// export const metadata: Metadata = {
//   title: 'Webhooks Management - AI Caller',
//   description: 'Configure and manage webhook endpoints for real-time event notifications from AI Caller.',
//   keywords: ['webhooks', 'event notifications', 'api integration', 'developer tools', 'AI Caller'],
// };

type WebhookStatus = "Active" | "Inactive";
type WebhookEventType = "onCallEnd" | "onCallFailed" | "onIntentMatch" | "onCampaignStatusChange" | "onPaymentSuccess" | "onPaymentFailure";

interface WebhookEntry {
  id: string;
  clientId: string;
  clientName: string;
  endpointUrl: string;
  eventTypes: WebhookEventType[];
  status: WebhookStatus;
  lastTriggerTime?: Date;
  successCount: number;
  failureCount: number;
  secretKey: string;
}

const mockClients = [
  { id: "client_1", name: "Innovate Corp" },
  { id: "client_2", name: "Solutions Ltd" },
  { id: "client_3", name: "Tech Ventures" },
];

const availableEventTypes: { id: WebhookEventType; label: string }[] = [
  { id: "onCallEnd", label: "Call Ended" },
  { id: "onCallFailed", label: "Call Failed" },
  { id: "onIntentMatch", label: "Intent Matched" },
  { id: "onCampaignStatusChange", label: "Campaign Status Changed" },
  { id: "onPaymentSuccess", label: "Payment Successful" },
  { id: "onPaymentFailure", label: "Payment Failed" },
];

const generateSecretKey = () => `whsec_${[...Array(32)].map(() => Math.random().toString(36)[2]).join('')}`;

const initialWebhooks: WebhookEntry[] = [
  { id: "wh_1", clientId: "client_1", clientName: "Innovate Corp", endpointUrl: "https://api.innovatecorp.com/webhooks/vox", eventTypes: ["onCallEnd", "onCallFailed"], status: "Active", lastTriggerTime: new Date(Date.now() - 3600000), successCount: 120, failureCount: 2, secretKey: generateSecretKey() },
  { id: "wh_2", clientId: "client_2", clientName: "Solutions Ltd", endpointUrl: "https://hooks.solutions.io/AI Caller", eventTypes: ["onCampaignStatusChange", "onPaymentSuccess"], status: "Inactive", successCount: 50, failureCount: 0, secretKey: generateSecretKey() },
  { id: "wh_3", clientId: "client_1", clientName: "Innovate Corp", endpointUrl: "https://notify.innovatecorp.com/events", eventTypes: ["onIntentMatch"], status: "Active", lastTriggerTime: new Date(Date.now() - 86400000), successCount: 300, failureCount: 15, secretKey: generateSecretKey() },
];

const webhookFormSchema = z.object({
  clientId: z.string({ required_error: "Please select a client." }),
  endpointUrl: z.string().url({ message: "Please enter a valid URL." }),
  eventTypes: z.array(z.string()).min(1, { message: "Please select at least one event type." }),
  status: z.boolean().default(true),
  secretKey: z.string().min(16, { message: "Secret key must be at least 16 characters." }),
});

type WebhookFormValues = z.infer<typeof webhookFormSchema>;

export default function WebhooksPage() {
  const { toast } = useToast();
  const [webhooks, setWebhooks] = React.useState<WebhookEntry[]>(initialWebhooks);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [editingWebhook, setEditingWebhook] = React.useState<WebhookEntry | null>(null);
  const [visibleSecrets, setVisibleSecrets] = React.useState<Record<string, boolean>>({});

  const form = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: {
      status: true,
      eventTypes: [],
      secretKey: generateSecretKey(),
    },
  });
  
  React.useEffect(() => {
    if (editingWebhook) {
      form.reset({
        clientId: editingWebhook.clientId,
        endpointUrl: editingWebhook.endpointUrl,
        eventTypes: editingWebhook.eventTypes,
        status: editingWebhook.status === "Active",
        secretKey: editingWebhook.secretKey,
      });
    } else {
      form.reset({
        clientId: undefined,
        endpointUrl: "",
        eventTypes: [],
        status: true,
        secretKey: generateSecretKey(),
      });
    }
  }, [editingWebhook, form, isSheetOpen]);

  const handleSheetOpen = (webhook?: WebhookEntry) => {
    setEditingWebhook(webhook || null);
    setIsSheetOpen(true);
  };

  const onSubmit = (data: WebhookFormValues) => {
    const client = mockClients.find(c => c.id === data.clientId);
    if (!client) return;

    if (editingWebhook) {
      setWebhooks(prev => prev.map(wh => wh.id === editingWebhook.id ? {
        ...editingWebhook,
        ...data,
        clientName: client.name,
        status: data.status ? "Active" : "Inactive",
      } : wh));
      toast({ title: "Webhook Updated", description: `Webhook for ${client.name} has been updated.` });
    } else {
      const newWebhook: WebhookEntry = {
        id: `wh_${Date.now()}`,
        clientId: data.clientId,
        clientName: client.name,
        endpointUrl: data.endpointUrl,
        eventTypes: data.eventTypes as WebhookEventType[],
        status: data.status ? "Active" : "Inactive",
        successCount: 0,
        failureCount: 0,
        secretKey: data.secretKey,
      };
      setWebhooks(prev => [newWebhook, ...prev]);
      toast({ title: "Webhook Added", description: `New webhook for ${client.name} created.` });
    }
    setIsSheetOpen(false);
    setEditingWebhook(null);
  };

  const toggleWebhookStatus = (webhookId: string) => {
    setWebhooks(prev => prev.map(wh => wh.id === webhookId ? { ...wh, status: wh.status === "Active" ? "Inactive" : "Active" } : wh));
    toast({ title: "Status Updated", description: "Webhook status has been toggled." });
  };

  const deleteWebhook = (webhookId: string) => {
    setWebhooks(prev => prev.filter(wh => wh.id !== webhookId));
    toast({ title: "Webhook Deleted", description: "Webhook has been removed.", variant: "destructive" });
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast({ title: "Secret Copied", description: "Webhook secret key copied to clipboard." });
  };
  
  const toggleSecretVisibility = (webhookId: string) => {
    setVisibleSecrets(prev => ({ ...prev, [webhookId]: !prev[webhookId] }));
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <ArrowRightLeft className="mr-3 h-8 w-8 text-primary" /> Webhooks Management
          </h1>
          <p className="text-muted-foreground">
            Configure and manage webhook endpoints for real-time event notifications.
          </p>
        </div>
        <Button onClick={() => handleSheetOpen()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Webhook Endpoint
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Webhook Endpoints</CardTitle>
          <CardDescription>View and manage all configured webhook endpoints.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Endpoint URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Secret Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stats (S/F)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.length > 0 ? webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell>{webhook.clientName}</TableCell>
                    <TableCell className="max-w-xs truncate" title={webhook.endpointUrl}>{webhook.endpointUrl}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.eventTypes.map(event => <Badge key={event} variant="secondary" className="text-xs">{availableEventTypes.find(e => e.id === event)?.label || event}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Input
                          type={visibleSecrets[webhook.id] ? "text" : "password"}
                          value={webhook.secretKey}
                          readOnly
                          className="font-mono text-xs h-7 flex-grow bg-muted/50 border-none"
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleSecretVisibility(webhook.id)}>
                           {visibleSecrets[webhook.id] ? <EyeOff className="h-3.5 w-3.5"/> : <Eye className="h-3.5 w-3.5"/>}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={webhook.status === "Active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                        {webhook.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className="text-xs">{webhook.successCount}/{webhook.failureCount}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleSheetOpen(webhook)}><Edit className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleWebhookStatus(webhook.id)}>
                            {webhook.status === "Active" ? <Pause className="mr-2 h-4 w-4"/> : <Play className="mr-2 h-4 w-4"/>}
                            {webhook.status === "Active" ? "Disable" : "Enable"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copySecret(webhook.secretKey)}><Copy className="mr-2 h-4 w-4"/>Copy Secret</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast({title: "View Logs (Mock)", description:"Feature to view delivery logs."})}><ListChecks className="mr-2 h-4 w-4"/>View Logs</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast({title: "Retry Failed (Mock)", description:"Feature to retry last failed delivery."})}><RotateCcw className="mr-2 h-4 w-4"/>Retry Failed</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deleteWebhook(webhook.id)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No webhooks configured yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Webhook Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><strong>Secure Your Endpoint:</strong> Always use HTTPS for your webhook URLs.</p>
            <p><strong>Validate Payloads:</strong> Use the provided Secret Key to generate an HMAC signature of the payload and verify it on your server to ensure requests are genuinely from AI Caller.</p>
            <p><strong>Respond Quickly:</strong> Your endpoint should acknowledge receipt of a webhook by returning a 2xx HTTP status code within a few seconds. Process complex logic asynchronously.</p>
            <p><strong>Handle Retries:</strong> Be prepared for AI Caller to retry sending webhooks if your endpoint doesn't respond successfully. Ensure your processing is idempotent.</p>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg w-full flex flex-col">
          <SheetHeader>
            <SheetTitle>{editingWebhook ? "Edit" : "Add New"} Webhook Endpoint</SheetTitle>
            <SheetDescription>
              {editingWebhook ? "Modify the details of this webhook." : "Configure a new endpoint to receive event notifications."}
            </SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow min-h-0">
              <ScrollArea className="flex-grow p-1">
                <div className="space-y-4 p-4">
                  <FormField control={form.control} name="clientId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger></FormControl>
                        <SelectContent>{mockClients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="endpointUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endpoint URL*</FormLabel>
                      <FormControl><Input placeholder="https://your-app.com/webhook" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="eventTypes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Types*</FormLabel>
                      <FormDescription>Select events that will trigger this webhook.</FormDescription>
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {availableEventTypes.map((item) => (
                          <FormField key={item.id} control={form.control} name="eventTypes" render={({ field: itemField }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={itemField.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? itemField.onChange([...(itemField.value || []), item.id])
                                      : itemField.onChange((itemField.value || []).filter((value) => value !== item.id));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">{item.label}</FormLabel>
                            </FormItem>
                          )} />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                   <FormField control={form.control} name="secretKey" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Secret Key*</FormLabel>
                        <div className="flex items-center gap-2">
                            <FormControl><Input placeholder="Auto-generated or custom" {...field} className="font-mono"/></FormControl>
                            <Button type="button" variant="outline" size="icon" onClick={() => form.setValue("secretKey", generateSecretKey())}><Sparkles className="h-4 w-4"/></Button>
                        </div>
                        <FormDescription>Used to sign and verify webhook payloads (HMAC-SHA256).</FormDescription>
                        <FormMessage />
                    </FormItem>
                   )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <FormLabel className="mb-0">Active Status</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                </div>
              </ScrollArea>
              <SheetFooter className="mt-auto p-4 border-t">
                <SheetClose asChild><Button type="button" variant="outline" onClick={() => setEditingWebhook(null)}>Cancel</Button></SheetClose>
                <Button type="submit">Save Webhook</Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
