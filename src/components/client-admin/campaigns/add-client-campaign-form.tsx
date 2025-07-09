
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
import { cn } from "@/lib/cn";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

// Mock AI Agents available to clients
const mockClientAiAgents = [
  { id: "tpl_client_welcome", name: "Client Welcome Call Agent" },
  { id: "tpl_client_feedback", name: "Client Feedback Survey Agent" },
  { id: "tpl_client_promo", name: "Client Promotional Offer Agent" },
];

const addClientCampaignFormSchema = z.object({
  campaignName: z.string().min(3, { message: "Campaign name must be at least 3 characters." }),
  campaignDescription: z.string().max(200, { message: "Description must be 200 characters or less." }).optional(),
  aiAgentId: z.string({ required_error: "Please select an AI agent." }),
  targetAudienceDescription: z.string().max(500, { message: "Target audience description is too long." }).optional(),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

type AddClientCampaignFormValues = z.infer<typeof addClientCampaignFormSchema>;

interface AddClientCampaignFormProps {
  onSuccess?: (data: AddClientCampaignFormValues) => void;
  onCancel?: () => void;
}

export function AddClientCampaignForm({ onSuccess, onCancel }: AddClientCampaignFormProps) {
  const { toast } = useToast();
  const form = useForm<AddClientCampaignFormValues>({
    resolver: zodResolver(addClientCampaignFormSchema),
    defaultValues: {
      campaignName: "",
      campaignDescription: "",
      aiAgentId: undefined,
      targetAudienceDescription: "",
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Default to 7 days from start
    },
  });

  function onSubmit(data: AddClientCampaignFormValues) {
    console.log("New Client Campaign Data (Simulated):", data);
    toast({
      title: "Campaign Creation Requested",
      description: `Your campaign "${data.campaignName}" has been submitted for setup. (Simulated)`,
    });
    form.reset();
    if (onSuccess) {
      onSuccess(data);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-4 px-2 py-4">
            <FormField
              control={form.control}
              name="campaignName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., My Q3 Product Launch" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="campaignDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Briefly describe your campaign's goal." {...field} className="text-sm min-h-[80px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aiAgentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Call Agent*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select an AI agent for calls" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mockClientAiAgents.map(agent => (
                        <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="targetAudienceDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Audience Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe your target audience (e.g., existing customers, new leads in specific region)." {...field} className="text-sm min-h-[100px]" />
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
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} />
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
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(date) => date < (form.getValues("startDate") || new Date(new Date().setDate(new Date().getDate() -1)))} />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormDescription className="text-xs">
                Note: Phone number lists and detailed targeting options will be configured after initial setup.
            </FormDescription>
            <p className="text-xs text-muted-foreground pt-2">* Required fields</p>
          </div>
        </ScrollArea>
        <SheetFooter className="pt-4 px-2 mt-auto border-t">
            <SheetClose asChild>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            </SheetClose>
            <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Submitting Campaign..." : "Submit Campaign Request"}
            </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}
