
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetFooter, SheetClose } from "@/components/ui/sheet"; 
import { urls } from '@/lib/config/urls';
import { cn } from "@/lib/cn";
import { Check, ChevronsUpDown, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import type { Campaign, CampaignType } from "@/app/(app)/campaigns/page";

const campaignTypes = ["Outbound", "Follow-Up", "Reminder"] as [CampaignType, ...CampaignType[]];

const addCampaignFormSchema = z.object({
  name: z.string().min(3, { message: "Campaign name must be at least 3 characters." }),
  clientId: z.string({ required_error: "Please select a client." }),
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

type AddCampaignFormValues = z.infer<typeof addCampaignFormSchema>;

interface AddCampaignFormProps {
  clients: { id: string; name: string }[];
  onSuccess: (data: Omit<Campaign, 'id' | 'callsAttempted' | 'status' | 'successRate'>) => void;
  onCancel: () => void;
}

export function AddCampaignForm({ clients, onSuccess, onCancel }: AddCampaignFormProps) {
  const [clientComboboxOpen, setClientComboboxOpen] = React.useState(false);
  const [sheetFile, setSheetFile] = React.useState<File | null>(null);
  const [agents, setAgents] = React.useState<{ id: string; name: string; client_id?: string }[]>([]);
  const [phoneNumbers, setPhoneNumbers] = React.useState<{ id: string; label: string }[]>([]);
  const [scheduleMode, setScheduleMode] = React.useState<'now' | 'later'>('later');

  const form = useForm<AddCampaignFormValues>({
    resolver: zodResolver(addCampaignFormSchema),
    defaultValues: {
      name: "",
      clientId: undefined,
      agentId: undefined,
      phoneNumberId: undefined,
      tags: "",
      type: undefined,
      startDate: undefined,
      endDate: undefined,
    },
  });

  const clientIdWatch = useWatch({ control: form.control, name: 'clientId' });

  // Load agents (filtered by client) and phone numbers; clear agent when client changes
  React.useEffect(() => {
    (async () => {
      try {
        const currentClientId = clientIdWatch || form.getValues('clientId');
        if (currentClientId) form.setValue('agentId', undefined as any);
        // Try primary backend URL first, then fallback to relative route
        const agentsUrl = urls.backend.campaigns.agents(currentClientId ? String(Number(currentClientId)) : undefined);
        let agentsJson: any = null;
        try {
          const r1 = await fetch(agentsUrl, { cache: 'no-store' });
          if (r1.ok) agentsJson = await r1.json();
        } catch {}
        if (!agentsJson) {
          try {
            const rel = currentClientId ? `/api/campaigns/agents?client_id=${encodeURIComponent(String(Number(currentClientId)))}` : '/api/campaigns/agents';
            const r2 = await fetch(rel, { cache: 'no-store' });
            if (r2.ok) agentsJson = await r2.json();
          } catch {}
        }

        const phonesRes = await fetch(urls.backend.campaigns.phoneNumbers(), { cache: 'no-store' });
        const phonesJson = await phonesRes.json();

        let agentsRows: any[] = [];
        if (Array.isArray(agentsJson?.data)) agentsRows = agentsJson.data;
        else if (Array.isArray(agentsJson?.agents)) agentsRows = agentsJson.agents;
        else if (Array.isArray(agentsJson)) agentsRows = agentsJson;
        setAgents((agentsRows || []).map((a: any) => ({ id: String(a.id ?? a.agent_id ?? a.uuid ?? a._id), name: a.name || a.agent_name || `Agent ${a.id ?? a.agent_id}` , client_id: String(a.client_id ?? '') })));
        const phoneList = Array.isArray(phonesJson?.phone_numbers) ? phonesJson.phone_numbers : (Array.isArray(phonesJson?.items) ? phonesJson.items : (Array.isArray(phonesJson) ? phonesJson : []));
        setPhoneNumbers(phoneList.map((p: any) => {
          const id = String(p.id || p.phone_number_id || p.number || p.e164 || p.uuid || p._id);
          const providerName = p.phone_provider || p.provider || '';
          const displayName = p.display_name || p.name || p.label || (providerName ? `${providerName} no.` : 'Number');
          const num = p.e164 || p.phone_number || p.number || p.e164_number || '';
          return { id, label: `${displayName}  (${num})` };
        }));
      } catch {}
    })();
  }, [clientIdWatch]);

  async function onSubmit(data: AddCampaignFormValues) {
    const selectedClient = clients.find(c => c.id === data.clientId);
    if (!selectedClient) {
      console.error("Client not found for submission");
      return; 
    }

    // If an Excel/CSV was provided, upload as multipart to backend, otherwise fall back to existing onSuccess flow
    if (sheetFile) {
      const form = new FormData();
      form.append('name', data.name);
      form.append('client_name', selectedClient.name);
      form.append('agent_name', agents.find(a => a.id === data.agentId)?.name || 'Unknown Agent');
      form.append('type', data.type);
      // Handle schedule mode: 'now' = immediate, 'later' = scheduled
      if (scheduleMode === 'now') {
        form.append('scheduled_time_unix', String(Math.floor(new Date().getTime() / 1000)));
      } else if (scheduleMode === 'later' && data.startDate) {
        form.append('scheduled_time_unix', String(Math.floor(new Date(data.startDate).getTime() / 1000)));
      }
      form.append('agent_id', data.agentId);
      form.append('phone_number_id', data.phoneNumberId);
      form.append('sheet', sheetFile);
      await fetch(urls.backend.campaigns.submit(), { method: 'POST', body: form });
      onSuccess({
        name: data.name,
        clientName: selectedClient.name,
        clientId: data.clientId,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        type: data.type as CampaignType,
        callsTargeted: 0,
        startDate: data.startDate ?? new Date(),
        endDate: data.endDate ?? new Date(),
        representativePhoneNumber: undefined,
      });
      return;
    }

    // If no file uploaded, submit with empty recipients (will be rejected by backend)
    if (!sheetFile) {
      const form = new FormData();
      form.append('name', data.name);
      form.append('client_name', selectedClient.name);
      form.append('agent_name', agents.find(a => a.id === data.agentId)?.name || 'Unknown Agent');
      form.append('type', data.type);
      // Handle schedule mode: 'now' = immediate, 'later' = scheduled
      if (scheduleMode === 'now') {
        form.append('scheduled_time_unix', String(Math.floor(new Date().getTime() / 1000)));
      } else if (scheduleMode === 'later' && data.startDate) {
        form.append('scheduled_time_unix', String(Math.floor(new Date(data.startDate).getTime() / 1000)));
      }
      form.append('agent_id', data.agentId);
      form.append('phone_number_id', data.phoneNumberId);
      // Submit empty form to trigger backend validation
      await fetch(urls.backend.campaigns.submit(), { method: 'POST', body: form });
      onSuccess({
        name: data.name,
        clientName: selectedClient.name,
        clientId: data.clientId,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        type: data.type as CampaignType,
        callsTargeted: 0,
        startDate: data.startDate ?? new Date(),
        endDate: data.endDate ?? new Date(),
        representativePhoneNumber: undefined,
      });
      return;
    }
    onSuccess({
      name: data.name,
      clientName: selectedClient.name,
      clientId: data.clientId,
      tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      type: data.type as CampaignType,
      callsTargeted: 0,
      startDate: data.startDate ?? new Date(),
      endDate: data.endDate ?? new Date(),
      representativePhoneNumber: undefined,
    });
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
                  <FormLabel>Campaign Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Q1 Product Outreach" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Assign to Client*</FormLabel>
                  <Popover open={clientComboboxOpen} onOpenChange={setClientComboboxOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn("w-full justify-between h-9 text-sm", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? clients.find(client => client.id === field.value)?.name : "Select client"}
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
                                value={client.name}
                                key={client.id}
                                onSelect={() => {
                                  form.setValue("clientId", client.id);
                                  setClientComboboxOpen(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", client.id === field.value ? "opacity-100" : "opacity-0")}/>
                                {client.name}
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
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., leadgen, q1, urgent" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Type*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select campaign type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {campaignTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Calls Targeted removed per requirements */}

            <div className="space-y-2">
              <FormLabel>Timing</FormLabel>
              <div className="flex gap-2">
                <Button type="button" variant={scheduleMode === 'now' ? 'default' : 'outline'} size="sm" onClick={() => setScheduleMode('now')}>Send immediately</Button>
                <Button type="button" variant={scheduleMode === 'later' ? 'default' : 'outline'} size="sm" onClick={() => setScheduleMode('later')}>Schedule for later</Button>
              </div>
              {scheduleMode === 'later' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal h-9 text-sm", !field.value && "text-muted-foreground")}
                              >
                                {field.value ? format(field.value, "PPpp") : <span>Today, 6:30 PM</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="agentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Agent*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!clientIdWatch}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder={clientIdWatch ? 'Select an agent' : 'Select client first'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {Array.isArray(agents) && agents.length > 0 ? (
                        agents.map(a => (
                          <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                        ))
                      ) : (
                        <SelectItem disabled value="__no_agents__">No agents for this client</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Phone Number*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select a phone number" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {phoneNumbers.map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Recipients</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  const header = 'phone_number,language,voice_id,first_message,prompt,city,other_dyn_variable\n';
                  const sampleData = '12345678900,en,,,London,\n48517067931,pl,,,Warsaw,\n';
                  const content = header + sampleData;
                  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'recipients_template.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                }}>Download Template</Button>
              </div>
              <Input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={(e) => setSheetFile(e.target.files?.[0] || null)} className="h-9 text-sm" />
              <FormDescription>
                Upload a CSV/XLSX with ElevenLabs format: phone_number, language, voice_id, first_message, prompt, city, other_dyn_variable
              </FormDescription>
            </div>
            <p className="text-xs text-muted-foreground pt-2">* Required fields</p>
          </div>
        </ScrollArea>
        <SheetFooter className="pt-4 px-2 mt-auto border-t">
            <SheetClose asChild>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            </SheetClose>
            <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating Campaign..." : "Create Campaign"}
            </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}

    