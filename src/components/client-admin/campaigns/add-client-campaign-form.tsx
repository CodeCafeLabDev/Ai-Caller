"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetFooter, SheetClose } from "@/components/ui/sheet"; 
import { urls } from '@/lib/config/urls';
import { cn } from "@/lib/cn";
import { CalendarIcon, Download, Upload } from "lucide-react";
import { format } from "date-fns";
import { useUser } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const campaignTypes = ["Outbound", "Follow-Up", "Reminder"] as const;
type CampaignType = typeof campaignTypes[number];

const addClientCampaignFormSchema = z.object({
  name: z.string().min(3, { message: "Campaign name must be at least 3 characters." }),
  agentId: z.string({ required_error: "Please select an agent." }),
  phoneNumberId: z.string({ required_error: "Please select a phone number." }),
  tags: z.string().refine(val => {
    if (!val.trim()) return true;
    return val.split(',').every(tag => tag.trim().length > 0);
  }, { message: "Tags should be comma-separated values, or leave empty."}).optional(),
  type: z.enum(campaignTypes, { required_error: "Please select a campaign type." }),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

type AddClientCampaignFormValues = z.infer<typeof addClientCampaignFormSchema>;

interface AddClientCampaignFormProps {
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

export function AddClientCampaignForm({ onSuccess, onCancel }: AddClientCampaignFormProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [sheetFile, setSheetFile] = React.useState<File | null>(null);
  const [agents, setAgents] = React.useState<{ id: string; name: string; client_id?: string }[]>([]);
  const [phoneNumbers, setPhoneNumbers] = React.useState<{ id: string; label: string }[]>([]);
  const [scheduleMode, setScheduleMode] = React.useState<'now' | 'later'>('now');
  const [loading, setLoading] = React.useState(false);

  const form = useForm<AddClientCampaignFormValues>({
    resolver: zodResolver(addClientCampaignFormSchema),
    defaultValues: {
      name: "",
      agentId: undefined,
      phoneNumberId: undefined,
      tags: "",
      type: undefined,
      startDate: undefined,
      endDate: undefined,
    },
  });

  const clientId = user?.clientId || user?.userId;

  // Load agents for the current client and phone numbers
  React.useEffect(() => {
    (async () => {
      if (!clientId) return;
      
      try {
        // Fetch agents for this client
        const agentsUrl = urls.backend.campaigns.agents(clientId);
        let agentsJson: any = null;
        try {
          const agentsRes = await fetch(agentsUrl, { cache: 'no-store' });
          if (agentsRes.ok) agentsJson = await agentsRes.json();
        } catch {}
        
        if (!agentsJson) {
          try {
            const rel = `/api/campaigns/agents?client_id=${encodeURIComponent(String(clientId))}`;
            const agentsRes = await fetch(rel, { cache: 'no-store' });
            if (agentsRes.ok) agentsJson = await agentsRes.json();
          } catch {}
        }

        let agentsRows: any[] = [];
        if (Array.isArray(agentsJson?.data)) agentsRows = agentsJson.data;
        else if (Array.isArray(agentsJson?.agents)) agentsRows = agentsJson.agents;
        else if (Array.isArray(agentsJson)) agentsRows = agentsJson;
        
        setAgents((agentsRows || []).map((a: any) => ({ 
          id: String(a.id ?? a.agent_id ?? a.uuid ?? a._id), 
          name: a.name || a.agent_name || `Agent ${a.id ?? a.agent_id}`, 
          client_id: String(a.client_id ?? '') 
        })));

        // Fetch phone numbers from ElevenLabs
        const phoneRes = await fetch(urls.backend.campaigns.phoneNumbers(), { cache: 'no-store' });
        if (phoneRes.ok) {
          const phoneData = await phoneRes.json();
          const phoneList = Array.isArray(phoneData?.phone_numbers) ? phoneData.phone_numbers : 
                           (Array.isArray(phoneData?.items) ? phoneData.items : 
                           (Array.isArray(phoneData) ? phoneData : []));
          setPhoneNumbers(phoneList.map((p: any) => {
            const id = String(p.id || p.phone_number_id || p.number || p.e164 || p.uuid || p._id);
            const providerName = p.phone_provider || p.provider || '';
            const displayName = p.display_name || p.name || p.label || (providerName ? `${providerName} no.` : 'Number');
            const num = p.e164 || p.phone_number || p.number || p.e164_number || '';
            return { id, label: `${displayName} (${num})` };
          }));
        }
      } catch (error) {
        console.error('Error loading form data:', error);
      }
    })();
  }, [clientId]);

  const downloadTemplate = () => {
    const csvContent = "phone_number,language,voice_id,first_message,prompt,city,other_dyn_variable\n+1234567890,en,default,Hello,You are a helpful assistant,New York,value1";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recipients_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSheetFile(file);
    }
  };

  const onSubmit = async (data: AddClientCampaignFormValues) => {
    if (!sheetFile) {
      toast({
        title: "Error",
        description: "Please upload a recipients file.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('client_name', user?.companyName || user?.name || 'Client');
      formData.append('client_id', clientId || '');
      formData.append('agent_name', agents.find(a => a.id === data.agentId)?.name || '');
      formData.append('type', data.type);
      formData.append('agent_id', data.agentId);
      formData.append('agent_phone_number_id', data.phoneNumberId);
      formData.append('sheetFile', sheetFile);
      
      if (data.tags) {
        formData.append('tags', data.tags);
      }

      if (scheduleMode === 'later' && data.startDate) {
        formData.append('scheduled_time_unix', Math.floor(data.startDate.getTime() / 1000).toString());
      }

      const res = await fetch(urls.backend.campaigns.submit(), {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        toast({
          title: "Success",
          description: "Campaign created successfully!"
        });
        onSuccess(result);
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create campaign');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className="h-[calc(100vh-200px)] pr-4">
          <div className="space-y-6">
            {/* Campaign Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter campaign name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assign to Agent */}
            <FormField
              control={form.control}
              name="agentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign to Agent *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an agent" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <ScrollArea className="h-48">
                        {agents.length > 0 ? (
                          agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-agents" disabled>
                            No agents available for this client
                          </SelectItem>
                        )}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select an agent to handle this campaign
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter tags (comma-separated)" {...field} />
                  </FormControl>
                  <FormDescription>
                    Add tags to categorize your campaign (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campaign Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select campaign type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {campaignTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone Number */}
            <FormField
              control={form.control}
              name="phoneNumberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Phone Number *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a phone number" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <ScrollArea className="h-48">
                        {phoneNumbers.map((phone) => (
                          <SelectItem key={phone.id} value={phone.id}>
                            {phone.label}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the phone number to use for this campaign
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recipients Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Recipients</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file with recipient phone numbers
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Upload Recipients File *</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="flex-1"
                  />
                  {sheetFile && (
                    <span className="text-sm text-green-600">
                      ✓ {sheetFile.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Supported formats: CSV, XLSX, XLS
                </p>
              </div>
            </div>

            {/* Timing Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Timing</h3>
                <p className="text-sm text-muted-foreground">
                  Choose when to start the campaign
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={scheduleMode === 'now' ? 'default' : 'outline'}
                  onClick={() => setScheduleMode('now')}
                  className="flex-1"
                >
                  Send immediately
                </Button>
                <Button
                  type="button"
                  variant={scheduleMode === 'later' ? 'default' : 'outline'}
                  onClick={() => setScheduleMode('later')}
                  className="flex-1"
                >
                  Schedule for later
                </Button>
              </div>

              {scheduleMode === 'later' && (
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Schedule Date & Time</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="flex gap-2">
          <SheetClose asChild>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </SheetClose>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Campaign"}
          </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}