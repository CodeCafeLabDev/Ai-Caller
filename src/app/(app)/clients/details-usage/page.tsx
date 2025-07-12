"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { UserCircle, BarChart3, FileBadge, NotebookText, Edit3, Phone, Mail, CalendarDays, Briefcase, Building } from "lucide-react";
import Image from "next/image"; 
import type { Metadata } from 'next';
import { useSearchParams } from "next/navigation";
import { api } from '@/lib/apiConfig';

// Metadata should be defined in a server component or route handler if possible.
// For client components, the nearest server layout/page handles overall metadata.
// We can add a comment here indicating what the metadata *would* be.
// Potential Metadata:
// export const metadata: Metadata = {
//   title: 'Client Details & Usage - AI Caller',
//   description: 'View detailed information, usage statistics, and plan details for a specific client.',
//   keywords: ['client details', 'client usage', 'customer analytics', 'subscription', 'AI Caller'],
// };

export default function ClientDetailsUsagePage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");
  const [client, setClient] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [clientStatus, setClientStatus] = React.useState(true);
  const [newNote, setNewNote] = React.useState("");

  React.useEffect(() => {
    if (!clientId) {
      setError("No clientId provided in URL.");
      setLoading(false);
      return;
    }
    setLoading(true);
    api.getClient(clientId)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setClient(data.data);
          setClientStatus(data.data.status === "Active");
          setError(null);
        } else {
          setError(data.message || "Failed to fetch client data.");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Error fetching client data.");
        setLoading(false);
      });
  }, [clientId]);

  const handleStatusChange = (checked: boolean) => {
    setClientStatus(checked);
    toast({
      title: "Account Status Updated",
      description: `${client?.companyName}'s account is now ${checked ? "Active" : "Suspended"}. (Simulated)`,
    });
    // In a real app, you would call an API to update the status
  };

  const handleSaveNote = () => {
    if (newNote.trim() === "") {
      toast({ title: "Note cannot be empty", variant: "destructive" });
      return;
    }
    toast({ title: "Note Saved", description: "Your internal note has been added." });
    setNewNote("");
    // In a real app, you would call an API to save the note
  };

  const handleChangePlan = () => {
    toast({ title: "Change Plan Clicked", description: "Plan change functionality to be implemented." });
  };

  if (loading) {
    return <div className="container mx-auto py-8">Loading client details...</div>;
  }
  if (error) {
    return <div className="container mx-auto py-8 text-red-500">{error}</div>;
  }
  if (!client) {
    return <div className="container mx-auto py-8">No client data found.</div>;
  }

  // Map backend fields to frontend fields for display
  const displayClient = {
    id: client.id,
    name: client.companyName,
    contactPerson: client.contactPersonName,
    email: client.companyEmail,
    phone: client.phoneNumber,
    clientId: client.id,
    status: client.status || "Active",
    plan: client.planName || "",
    totalCallsMade: client.totalCallsMade || 0,
    monthlyCallLimit: client.monthlyCallLimit || 0,
    joinedDate: client.created_at || new Date().toISOString(),
    avatarUrl: client.avatarUrl || "",
    address: client.address || "",
    voiceMinutesUsed: client.voiceMinutesUsed || 0,
    voiceMinutesLimit: client.voiceMinutesLimit || 0,
    agentsUsed: client.agentsUsed || 0,
    agentsLimit: client.agentsLimit || 0,
    callSuccessRate: client.callSuccessRate || "N/A",
    renewalDate: client.renewalDate || new Date().toISOString(),
    billingCycle: client.billingCycle || "Monthly",
    topCampaigns: client.topCampaigns || [],
    internalNotes: client.internalNotes || [],
    systemLogs: client.systemLogs || [],
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={displayClient.avatarUrl} alt={displayClient.name} data-ai-hint="company logo" />
            <AvatarFallback>{displayClient.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold font-headline">{displayClient.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" /> {displayClient.email}
            </p>
            <p className="text-muted-foreground flex items-center gap-2">
              <Phone className="h-4 w-4" /> {displayClient.phone}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="lg">
            <Edit3 className="mr-2 h-4 w-4" /> Edit Client
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview"><UserCircle className="mr-2 h-4 w-4" />Overview</TabsTrigger>
          <TabsTrigger value="usage"><BarChart3 className="mr-2 h-4 w-4" />Usage</TabsTrigger>
          <TabsTrigger value="plan-info"><FileBadge className="mr-2 h-4 w-4" />Plan Info</TabsTrigger>
          <TabsTrigger value="notes-logs"><NotebookText className="mr-2 h-4 w-4" />Notes & Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Overview</CardTitle>
              <CardDescription>General information and status for {displayClient.name}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><Building className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Company Name:</strong> {displayClient.name}</div>
                <div><Briefcase className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Contact Person:</strong> {displayClient.contactPerson}</div>
                <div><Mail className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Email:</strong> {displayClient.email}</div>
                <div><Phone className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Phone:</strong> {displayClient.phone}</div>
                <div><CalendarDays className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Joined Date:</strong> {new Date(displayClient.joinedDate).toLocaleDateString()}</div>
                <div><FileBadge className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Client ID:</strong> {displayClient.clientId}</div>
              </div>
              <Separator className="my-4" />
              <div className="grid md:grid-cols-2 gap-4 items-center">
                 <div><strong>Current Plan:</strong> <Badge variant={displayClient.plan === "Premium" ? "default" : "secondary"}>{displayClient.plan}</Badge></div>
                <div className="flex items-center space-x-3">
                  <Switch id="account-status" checked={clientStatus} onCheckedChange={handleStatusChange} />
                  <Label htmlFor="account-status" className="text-sm">
                    Account Status: <Badge variant={clientStatus ? "default" : "destructive"} className={clientStatus ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}>{clientStatus ? "Active" : "Suspended"}</Badge>
                  </Label>
                </div>
              </div>
               <div className="mt-2">
                <strong>Address:</strong>
                <p className="text-sm text-muted-foreground">{displayClient.address}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader><CardTitle>Total Calls</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{displayClient.totalCallsMade} / {displayClient.monthlyCallLimit}</p>
                <Progress value={(displayClient.totalCallsMade / displayClient.monthlyCallLimit) * 100} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-1">Monthly Limit</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader><CardTitle>Voice Minutes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{displayClient.voiceMinutesUsed} / {displayClient.voiceMinutesLimit}</p>
                <Progress value={(displayClient.voiceMinutesUsed / displayClient.voiceMinutesLimit) * 100} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-1">Monthly Limit</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Call Success Rate</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{displayClient.callSuccessRate}</p>
                 <p className="text-xs text-muted-foreground mt-1">Based on last 30 days</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
                <CardTitle>Agents Used</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{displayClient.agentsUsed} / {displayClient.agentsLimit}</p>
                <Progress value={(displayClient.agentsUsed / displayClient.agentsLimit) * 100} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-1">Monthly Limit</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Top Performing Campaigns</CardTitle></CardHeader>
            <CardContent>
              {displayClient.topCampaigns.length > 0 ? (
                <ul className="space-y-2">
                  {displayClient.topCampaigns.map((campaign: any) => (
                    <li key={campaign.id} className="flex justify-between items-center p-2 border rounded-md">
                      <span>{campaign.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={campaign.status === "Active" ? "default" : "outline"}>{campaign.status}</Badge>
                        <span>Success: {campaign.successRate}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No campaign data available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan-info" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan: {displayClient.plan}</CardTitle>
              <CardDescription>Details about the client's current subscription plan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Limits Overview:</h3>
                <ul className="list-disc list-inside pl-4 space-y-1 text-sm text-muted-foreground">
                  <li>Monthly Calls: {displayClient.monthlyCallLimit}</li>
                  <li>Voice Minutes: {displayClient.voiceMinutesLimit} / month</li>
                  <li>AI Agents: {displayClient.agentsLimit}</li>
                </ul>
              </div>
              <div>
                <strong>Renewal Date:</strong> {new Date(displayClient.renewalDate).toLocaleDateString()}
              </div>
              <div>
                <strong>Billing Cycle:</strong> {displayClient.billingCycle}
              </div>
              <Button className="mt-2" onClick={handleChangePlan}>
                <Edit3 className="mr-2 h-4 w-4" /> Change Plan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes-logs" className="mt-6 space-y-6">
          <Card>
            <CardHeader><CardTitle>Internal Notes</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add internal notes about this client..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="min-h-[100px]"
              />
              <Button onClick={handleSaveNote} className="mt-3">Save Note</Button>
              <div className="mt-4 space-y-3">
                {displayClient.internalNotes.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((note: any) => (
                  <div key={note.id} className="p-3 border rounded-md bg-muted/50">
                    <p className="text-sm">{note.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">By {note.user} on {new Date(note.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>System Logs</CardTitle></CardHeader>
            <CardContent>
              {displayClient.systemLogs.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {displayClient.systemLogs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log: any) => (
                    <li key={log.id} className="p-2 border rounded-md">
                      <span className="font-medium">{new Date(log.date).toLocaleString()}:</span> {log.event}
                    </li>
                  ))}
                </ul>
              ) : (
                 <p className="text-muted-foreground">No system logs available for this client.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
