
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Ban, CheckCircle, CalendarClock, Edit, Tag, Users, FileDown, PlayCircle, ChevronsUpDown, Check } from "lucide-react";
import { format } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { Metadata } from 'next';

// export const metadata: Metadata = {
//   title: 'Client Account Status - AI Caller',
//   description: 'Manage client account access, trial periods, and log status changes.',
//   keywords: ['client status', 'account management', 'suspend client', 'trial management', 'AI Caller'],
// };


const mockClients = [
  { id: "1", name: "Innovate Corp", status: "Active" },
  { id: "2", name: "Solutions Ltd", status: "Suspended" },
  { id: "3", name: "Tech Ventures", status: "Trial" },
];

export default function AccountStatusManagementPage() {
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = React.useState<string | undefined>(mockClients[0]?.id);
  const [expiryDate, setExpiryDate] = React.useState<Date | undefined>();
  const [isTrial, setIsTrial] = React.useState(false);
  const [suspensionReason, setSuspensionReason] = React.useState("");
  const [logNotes, setLogNotes] = React.useState("");
  const [clientComboboxOpen, setClientComboboxOpen] = React.useState(false);

  const selectedClient = mockClients.find(c => c.id === selectedClientId);

  const handleAction = (actionName: string) => {
    if (!selectedClientId) {
      toast({ title: "No Client Selected", description: "Please select a client first.", variant: "destructive" });
      return;
    }
    toast({
      title: `${actionName} (Simulated)`,
      description: `Action performed on ${selectedClient?.name}.`,
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Account Status Management</h1>
        <p className="text-muted-foreground">Control client account access, manage trial periods, and log status changes.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Client</CardTitle>
          <CardDescription>Choose a client to manage their account status.</CardDescription>
        </CardHeader>
        <CardContent>
          <Popover open={clientComboboxOpen} onOpenChange={setClientComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={clientComboboxOpen}
                className="w-full md:w-1/2 justify-between"
              >
                {selectedClientId
                  ? mockClients.find(client => client.id === selectedClientId)?.name
                  : "Select a client..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full md:w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Search client..." />
                <CommandList>
                  <CommandEmpty>No client found.</CommandEmpty>
                  <CommandGroup>
                    {mockClients.map(client => (
                      <CommandItem
                        key={client.id}
                        value={client.name}
                        onSelect={(currentValue) => {
                          const clientObj = mockClients.find(c => c.name.toLowerCase() === currentValue.toLowerCase());
                          setSelectedClientId(clientObj ? clientObj.id : undefined);
                          setClientComboboxOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedClientId === client.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {client.name} (Status: {client.status})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {selectedClientId && selectedClient && (
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Direct Account Actions</CardTitle>
              <CardDescription>Instantly change the client's account status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => handleAction("Suspend Account")} 
                className="w-full" 
                variant="destructive"
                disabled={selectedClient.status === "Suspended"}
              >
                <Ban className="mr-2 h-4 w-4" /> Suspend Account
              </Button>
              <Button 
                onClick={() => handleAction("Reactivate Account")} 
                className="w-full"
                disabled={selectedClient.status === "Active"}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Reactivate Account
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trial & Expiry Management</CardTitle>
              <CardDescription>Set or modify trial periods and account expiry dates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="trial-mode" checked={isTrial} onCheckedChange={setIsTrial} />
                <Label htmlFor="trial-mode">Mark as Trial / Expired Trial</Label>
              </div>
              {isTrial && (
                <Input type="number" placeholder="Trial duration in days (e.g., 14)" />
              )}
              <div>
                <Label htmlFor="expiry-date">Set Expiry Date / Auto-disable</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal mt-1"
                    >
                      <CalendarClock className="mr-2 h-4 w-4" />
                      {expiryDate ? format(expiryDate, "PPP") : <span>Pick an expiry date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={expiryDate}
                      onSelect={setExpiryDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
               <Button onClick={() => handleAction("Update Expiry/Trial")} className="w-full mt-2">
                <Edit className="mr-2 h-4 w-4" /> Update Expiry/Trial Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Log Suspension Reason & Notes</CardTitle>
              <CardDescription>Keep internal records for account status changes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="suspension-reason">Assign Suspension Reason</Label>
                <Input 
                  id="suspension-reason" 
                  placeholder="e.g., Overdue payment, ToS violation" 
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="log-notes">Internal Notes</Label>
                <Textarea 
                  id="log-notes"
                  placeholder="Add any relevant details or context for this status change..."
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  className="mt-1 min-h-[100px]"
                />
              </div>
              <Button onClick={() => handleAction("Save Reason & Notes")} className="w-full">
                Save Reason & Notes
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Automation Ideas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Auto-suspend overdue clients:</strong> Integrate with billing to automatically suspend accounts with overdue payments.</p>
            <p><strong>Email notifications:</strong> Send automated emails to clients and internal teams upon account status changes.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Optional Enhancements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start text-left">
              <Users className="mr-2 h-4 w-4" /> Bulk Actions (Suspend, Assign Plan)
            </Button>
            <Button variant="outline" className="w-full justify-start text-left">
              <FileDown className="mr-2 h-4 w-4" /> Export Client List (CSV/Excel)
            </Button>
            <Button variant="outline" className="w-full justify-start text-left">
              <PlayCircle className="mr-2 h-4 w-4" /> Impersonate Client Admin
            </Button>
             <Button variant="outline" className="w-full justify-start text-left">
              <Tag className="mr-2 h-4 w-4" /> Manage Custom Tags (Industry, Region)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
