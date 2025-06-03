
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
import { useToast } from "@/hooks/use-toast";
import { UserCircle, BarChart3, FileBadge, NotebookText, Edit3, Phone, Mail, CalendarDays, Briefcase, Building } from "lucide-react";
import Image from "next/image"; // Keep if any other images might be used

// Mock client data for demonstration - ensure all fields from requirements are here
const mockClient = {
  id: "1",
  name: "Innovate Corp",
  contactPerson: "Alice Wonderland",
  email: "contact@innovatecorp.com",
  phone: "555-0101",
  clientId: "CL-INV001",
  status: "Active" as "Active" | "Suspended" | "Trial",
  plan: "Premium",
  totalCallsMade: 1250,
  monthlyCallLimit: 2000,
  joinedDate: "2023-01-15",
  avatarUrl: "https://placehold.co/64x64.png?text=IC",
  address: "123 Innovation Drive, Techville, USA",
  voiceMinutesUsed: 7500,
  voiceMinutesLimit: 10000,
  templatesUsed: 5,
  templatesLimit: 10,
  callSuccessRate: "92%",
  renewalDate: "2024-12-15",
  billingCycle: "Monthly",
  topCampaigns: [
    { id: "camp1", name: "Q4 Lead Gen", status: "Active", successRate: "95%" },
    { id: "camp2", name: "New Product Launch", status: "Completed", successRate: "88%" },
  ],
  internalNotes: [
    { id: "note1", user: "Admin", date: "2024-07-10", text: "Client interested in upgrading to Enterprise next quarter." },
  ],
  systemLogs: [
    { id: "log1", date: "2024-07-01", event: "Plan changed to Premium." },
    { id: "log2", date: "2024-06-15", event: "Payment successful for June." },
  ]
};

export default function ClientDetailsUsagePage() {
  const { toast } = useToast();
  const [clientStatus, setClientStatus] = React.useState(mockClient.status === "Active");
  const [newNote, setNewNote] = React.useState("");

  // In a real app, you'd use useSearchParams to get clientId and fetch data
  // const searchParams = useSearchParams();
  // const clientId = searchParams.get('clientId');
  // React.useEffect(() => {
  //   if (clientId) {
  //     // Fetch client data based on clientId
  //     // For now, we continue using mockClient
  //   }
  // }, [clientId]);


  const handleStatusChange = (checked: boolean) => {
    setClientStatus(checked);
    toast({
      title: "Account Status Updated",
      description: `${mockClient.name}'s account is now ${checked ? "Active" : "Suspended"}. (Simulated)`,
    });
    // In a real app, you would call an API to update the status
  };

  const handleSaveNote = () => {
    if (newNote.trim() === "") {
      toast({ title: "Note cannot be empty", variant: "destructive" });
      return;
    }
    console.log("New note saved (simulated):", newNote);
    toast({ title: "Note Saved", description: "Your internal note has been added." });
    // Add to mockClient.internalNotes or call API
    mockClient.internalNotes.push({ id: `note${Date.now()}`, user: "Current User", date: new Date().toISOString().split('T')[0], text: newNote });
    setNewNote("");
  };

  const handleChangePlan = () => {
    toast({title: "Change Plan Clicked", description: "Plan change functionality to be implemented."})
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={mockClient.avatarUrl} alt={mockClient.name} data-ai-hint="company logo" />
            <AvatarFallback>{mockClient.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold font-headline">{mockClient.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" /> {mockClient.email}
            </p>
            <p className="text-muted-foreground flex items-center gap-2">
              <Phone className="h-4 w-4" /> {mockClient.phone}
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
              <CardDescription>General information and status for {mockClient.name}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><Building className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Company Name:</strong> {mockClient.name}</div>
                <div><Briefcase className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Contact Person:</strong> {mockClient.contactPerson}</div>
                <div><Mail className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Email:</strong> {mockClient.email}</div>
                <div><Phone className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Phone:</strong> {mockClient.phone}</div>
                <div><CalendarDays className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Joined Date:</strong> {new Date(mockClient.joinedDate).toLocaleDateString()}</div>
                <div><FileBadge className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Client ID:</strong> {mockClient.clientId}</div>
              </div>
              <Separator className="my-4" />
              <div className="grid md:grid-cols-2 gap-4 items-center">
                 <div><strong>Current Plan:</strong> <Badge variant={mockClient.plan === "Premium" ? "default" : "secondary"}>{mockClient.plan}</Badge></div>
                <div className="flex items-center space-x-3">
                  <Switch id="account-status" checked={clientStatus} onCheckedChange={handleStatusChange} />
                  <Label htmlFor="account-status" className="text-sm">
                    Account Status: <Badge variant={clientStatus ? "default" : "destructive"} className={clientStatus ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}>{clientStatus ? "Active" : "Suspended"}</Badge>
                  </Label>
                </div>
              </div>
               <div className="mt-2">
                <strong>Address:</strong>
                <p className="text-sm text-muted-foreground">{mockClient.address}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader><CardTitle>Total Calls</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{mockClient.totalCallsMade} / {mockClient.monthlyCallLimit}</p>
                <Progress value={(mockClient.totalCallsMade / mockClient.monthlyCallLimit) * 100} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-1">Monthly Limit</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader><CardTitle>Voice Minutes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{mockClient.voiceMinutesUsed} / {mockClient.voiceMinutesLimit}</p>
                <Progress value={(mockClient.voiceMinutesUsed / mockClient.voiceMinutesLimit) * 100} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-1">Monthly Limit</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Call Success Rate</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{mockClient.callSuccessRate}</p>
                 <p className="text-xs text-muted-foreground mt-1">Based on last 30 days</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
                <CardTitle>Templates Used</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{mockClient.templatesUsed} / {mockClient.templatesLimit}</p>
                <Progress value={(mockClient.templatesUsed / mockClient.templatesLimit) * 100} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-1">Monthly Limit</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Top Performing Campaigns</CardTitle></CardHeader>
            <CardContent>
              {mockClient.topCampaigns.length > 0 ? (
                <ul className="space-y-2">
                  {mockClient.topCampaigns.map(campaign => (
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
              <CardTitle>Current Plan: {mockClient.plan}</CardTitle>
              <CardDescription>Details about the client's current subscription plan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Limits Overview:</h3>
                <ul className="list-disc list-inside pl-4 space-y-1 text-sm text-muted-foreground">
                  <li>Monthly Calls: {mockClient.monthlyCallLimit}</li>
                  <li>Voice Minutes: {mockClient.voiceMinutesLimit} / month</li>
                  <li>AI Templates: {mockClient.templatesLimit}</li>
                </ul>
              </div>
              <div>
                <strong>Renewal Date:</strong> {new Date(mockClient.renewalDate).toLocaleDateString()}
              </div>
              <div>
                <strong>Billing Cycle:</strong> {mockClient.billingCycle}
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
                {mockClient.internalNotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(note => (
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
              {mockClient.systemLogs.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {mockClient.systemLogs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
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
