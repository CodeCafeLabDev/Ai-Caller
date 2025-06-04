
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetFooter, SheetClose } from "@/components/ui/sheet"; 
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import type { Campaign, CampaignType } from "@/app/(app)/campaigns/page";

const campaignTypes: CampaignType[] = ["Outbound", "Follow-Up", "Reminder"];

const addCampaignFormSchema = z.object({
  name: z.string().min(3, { message: "Campaign name must be at least 3 characters." }),
  clientId: z.string({ required_error: "Please select a client." }),
  tags: z.string().refine(val => {
    if (!val.trim()) return true; // Allow empty or whitespace-only string as optional
    return val.split(',').every(tag => tag.trim().length > 0);
  }, { message: "Tags should be comma-separated values, or leave empty."}).optional(),
  type: z.enum(campaignTypes, { required_error: "Please select a campaign type." }),
  callsTargeted: z.coerce.number().int().positive({ message: "Targeted calls must be a positive number." }),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  representativePhoneNumber: z.string().optional(),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

type AddCampaignFormValues = z.infer<typeof addCampaignFormSchema>;

interface AddCampaignFormProps {
  clients: { id: string; name: string }[];
  onSuccess: (data: Omit<Campaign, 'id' | 'callsAttempted' | 'status' | 'successRate'>) => void;
  onCancel: () => void;
}

export function AddCampaignForm({ clients, onSuccess, onCancel }: AddCampaignFormProps) {
  const [clientComboboxOpen, setClientComboboxOpen] = React.useState(false);

  const form = useForm<AddCampaignFormValues>({
    resolver: zodResolver(addCampaignFormSchema),
    defaultValues: {
      name: "",
      clientId: undefined,
      tags: "",
      type: undefined,
      callsTargeted: undefined,
      startDate: undefined,
      endDate: undefined,
      representativePhoneNumber: "",
    },
  });

  function onSubmit(data: AddCampaignFormValues) {
    const selectedClient = clients.find(c => c.id === data.clientId);
    if (!selectedClient) {
      console.error("Client not found for submission");
      return; 
    }

    const campaignDataToSubmit = {
        name: data.name,
        clientName: selectedClient.name,
        clientId: data.clientId,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        type: data.type,
        callsTargeted: data.callsTargeted,
        startDate: data.startDate,
        endDate: data.endDate,
        representativePhoneNumber: data.representativePhoneNumber || undefined,
    };
    onSuccess(campaignDataToSubmit);
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

            <FormField
              control={form.control}
              name="callsTargeted"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calls Targeted*</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 500" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date*</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal h-9 text-sm", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date*</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal h-9 text-sm", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
            
            <FormField
              control={form.control}
              name="representativePhoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Representative Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 555-0199" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormDescription>Phone number associated with this campaign for tracking/identification.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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

    