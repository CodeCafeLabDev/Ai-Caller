"use client";
export const dynamic = "force-dynamic";

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
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { elevenLabsApi } from '@/lib/elevenlabsApi';

// Metadata should be defined in a server component or route handler if possible.
// For client components, the nearest server layout/page handles overall metadata.
// We can add a comment here indicating what the metadata *would* be.
// Potential Metadata:
// export const metadata: Metadata = {
//   title: 'Client Details & Usage - AI Caller',
//   description: 'View detailed information, usage statistics, and plan details for a specific client.',
//   keywords: ['client details', 'client usage', 'customer analytics', 'subscription', 'AI Caller'],
// };

function ClientDetailsUsagePageInner() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");
  const [client, setClient] = React.useState<any | null>(null);
  const [monthlyCalls, setMonthlyCalls] = React.useState<number>(0);
  const [assignedPlans, setAssignedPlans] = React.useState<any[]>([]);
  const [analyticsTotals, setAnalyticsTotals] = React.useState<{ totalCalls: number; successRate: number; totalDurationSecs: number; usedAgents: number; totalAgents: number } | null>(null);
  const aggregatedEnabledLimit = React.useMemo(() => {
    try {
      return assignedPlans
        .filter((ap: any) => (ap.isEnabled === 1 || ap.isEnabled === true) && (ap.isActive === 1 || ap.isActive === true))
        .reduce((sum: number, ap: any) => sum + (parseInt(ap.monthlyLimit, 10) || 0), 0);
    } catch {
      return 0;
    }
  }, [assignedPlans]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [clientStatus, setClientStatus] = React.useState(true);
  const [newNote, setNewNote] = React.useState("");
  const router = useRouter();

  // Stable handler to update KPI cards only when values actually change
  const handleTotalsChange = React.useCallback((totals: any, totalAgents: number) => {
    const newVals = {
      totalCalls: totals?.totalCalls || 0,
      successRate: totals?.successRate || 0,
      totalDurationSecs: totals?.totalDurationSecs || 0,
      usedAgents: totals?.usedAgents || 0,
      totalAgents: totalAgents || 0,
    };
    setAnalyticsTotals((prev) => {
      if (
        !prev ||
        prev.totalCalls !== newVals.totalCalls ||
        prev.successRate !== newVals.successRate ||
        prev.totalDurationSecs !== newVals.totalDurationSecs ||
        prev.usedAgents !== newVals.usedAgents ||
        prev.totalAgents !== newVals.totalAgents
      ) {
        return newVals;
      }
      return prev;
    });
  }, []);

  React.useEffect(() => {
    if (!clientId) {
      setError("No clientId provided in URL.");
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      api.getClient(clientId).then((r) => r.json()),
      api.getAgentsAnalytics(clientId, 30).then((r) => r.json()).catch(() => null),
      api.getAssignedPlansForClient(clientId).then((r) => r.json()).catch(() => ({ data: [] })),
    ])
      .then(([clientResp, analyticsResp, plansResp]) => {
        if (clientResp?.success) {
          setClient(clientResp.data);
          setClientStatus(clientResp.data.status === "Active");
          setError(null);
        } else {
          setError(clientResp?.message || "Failed to fetch client data.");
        }
        if (analyticsResp?.success && analyticsResp?.data) {
          const totals = analyticsResp.data.totals || { totalCalls: 0, successRate: 0, totalDurationSecs: 0 };
          const agents = Array.isArray(analyticsResp.data.agents) ? analyticsResp.data.agents : [];
          const usedAgents = agents.filter((a: any) => (a.totalCalls || 0) > 0).length;
          const totalAgents = agents.length;
          setAnalyticsTotals({ totalCalls: totals.totalCalls || 0, successRate: totals.successRate || 0, totalDurationSecs: totals.totalDurationSecs || 0, usedAgents, totalAgents });
          setMonthlyCalls(Number(totals.totalCalls || 0));
        }
        if (Array.isArray(plansResp?.data)) {
          setAssignedPlans(plansResp.data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Error fetching client data.");
        setLoading(false);
      });
  }, [clientId]);

  const handleStatusChange = async (checked: boolean) => {
    if (!client) return;
    const newStatus = checked ? "Active" : "Suspended";
    // Sanitize payload: remove computed/aggregated fields not present in DB
    const blacklist = [
      'planName',
      'planNames',
      'totalMonthlyLimit',
      'monthlyCallLimit',
      'monthlyCallsMade',
      'totalCallsMade',
      'created_at',
      'updated_at'
    ];
    const clientData: any = Object.fromEntries(Object.entries(client).filter(([k]) => !blacklist.includes(String(k))));
    try {
      // Send update to backend
      const res = await api.updateClient(client.id.toString(), { ...clientData, status: newStatus });
      const data = await res.json();
      if (data.success) {
        setClientStatus(checked);
        setClient((prev: any) => prev ? { ...prev, status: newStatus } : prev);
        toast({
          title: "Account Status Updated",
          description: `${client.companyName}'s account is now ${newStatus}.`,
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update status.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
    }
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
    plan: client.planNames || "",
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
          <Button variant="outline" size="lg" onClick={() => router.push(`/clients/edit?clientId=${displayClient.id}`)}>
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
                <p className="text-3xl font-bold">{analyticsTotals?.totalCalls ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Conversations across all agents (last 30 days)</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader><CardTitle>Voice Minutes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{Math.round(((analyticsTotals?.totalDurationSecs || 0) / 60))}</p>
                <p className="text-xs text-muted-foreground mt-1">Total minutes spoken (last 30 days)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Call Success Rate</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{analyticsTotals?.successRate ?? 0}%</p>
                 <p className="text-xs text-muted-foreground mt-1">Successful / All conversations</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
                <CardTitle>Agents Used</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{analyticsTotals ? `${analyticsTotals.usedAgents} / ${analyticsTotals.totalAgents}` : '0 / 0'}</p>
                <Progress value={(analyticsTotals && analyticsTotals.totalAgents > 0) ? (analyticsTotals.usedAgents / analyticsTotals.totalAgents) * 100 : 0} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-1">Agents that had at least one conversation</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Agent Analytics (last 30 days)</CardTitle></CardHeader>
            <CardContent>
              <AgentAnalytics
                clientId={String(displayClient.clientId)}
                onTotalsChange={handleTotalsChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan-info" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Plans</CardTitle>
              <CardDescription>Active plans contribute to the monthly call limit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignedPlans.length > 0 ? (
                <div className="space-y-3">
                  {assignedPlans.map((ap: any) => {
                    const isEnabled = ap.isEnabled === 1 || ap.isEnabled === true;
                    const isActive = ap.isActive === 1 || ap.isActive === true;
                    return (
                      <div key={ap.assignmentId} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{ap.planName}</span>
                            {isEnabled && isActive ? (
                              <Badge className="bg-green-600 text-white">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">Monthly Limit: {ap.monthlyLimit || 0}</div>
                          <div className="text-xs text-muted-foreground">Start: {ap.startDate ? new Date(ap.startDate).toLocaleDateString() : 'N/A'}{ap.durationDays ? ` • Duration: ${ap.durationDays} days` : ''}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Label htmlFor={`enable-${ap.assignmentId}`} className="text-xs">Enable</Label>
                          <Switch
                            id={`enable-${ap.assignmentId}`}
                            checked={!!isEnabled}
                            onCheckedChange={async (checked) => {
                              try {
                                await api.toggleAssignedPlanEnabled(String(ap.assignmentId), !!checked);
                                // refresh assigned plans
                                const resp = await api.getAssignedPlansForClient(String(displayClient.clientId));
                                const j = await resp.json();
                                setAssignedPlans(Array.isArray(j.data) ? j.data : []);
                              } catch {}
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No plans assigned yet.</div>
              )}
              <Separator className="my-2" />
              <div>
                <h3 className="font-semibold mb-1">Aggregated Limits:</h3>
                <ul className="list-disc list-inside pl-4 space-y-1 text-sm text-muted-foreground">
                  <li>Monthly Calls Total (enabled & active): {aggregatedEnabledLimit}</li>
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

export default function ClientDetailsUsagePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientDetailsUsagePageInner />
    </Suspense>
  );
}

function AgentAnalytics({ clientId, onTotalsChange }: { clientId: string; onTotalsChange?: (totals: any, totalAgents: number) => void }) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<{ agents: any[]; totals: any } | null>(null);
  const [allClientAgents, setAllClientAgents] = React.useState<any[]>([]);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.getAgentsAnalytics(clientId, 30);
        const j = await res.json();
        if (mounted) {
          if (j?.success) setData(j.data);
          else setError(j?.message || 'Failed to fetch');
        }
      } catch (e: any) {
        if (mounted) setError(String(e?.message || e));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    // Poll every 30s, but only if mounted
    const interval = setInterval(() => { if (mounted) load(); }, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, [clientId]);

  // Always load the complete agent list for this client (to include zero-activity agents)
  React.useEffect(() => {
    let active = true;
    async function loadAgents() {
      try {
        const agentsRes = await fetch('/api/agents', { credentials: 'include' });
        const agentsJson = await agentsRes.json();
        const allAgents = Array.isArray(agentsJson?.data) ? agentsJson.data : [];
        // Base filter: owned by client, created by client, or linked via client_ids
        const prelim = allAgents.filter((a: any) => {
          const owned = String(a.client_id || '') === String(clientId);
          const created = a.created_by_type === 'client' && String(a.created_by) === String(clientId);
          const linkedRaw = a.client_ids;
          const linkedIds: string[] = Array.isArray(linkedRaw)
            ? linkedRaw.map((x: any) => String(x))
            : typeof linkedRaw === 'string'
              ? linkedRaw.split(',').map((x: string) => x.trim()).filter(Boolean)
              : [];
          const linked = linkedIds.includes(String(clientId));
          return owned || created || linked;
        });

        // Also include elevenlabs_agent_ids stored on the client record
        try {
          const clientResp = await api.getClient(String(clientId));
          const clientJson = await clientResp.json();
          const rawIds = clientJson?.data?.elevenlabs_agent_ids;
          let ids: string[] = [];
          if (Array.isArray(rawIds)) ids = rawIds.map((x: any) => String(x));
          else if (typeof rawIds === 'string') {
            try {
              const parsed = JSON.parse(rawIds);
              if (Array.isArray(parsed)) ids = parsed.map((x: any) => String(x));
              else ids = rawIds.split(',').map((x: string) => x.trim()).filter(Boolean);
            } catch {
              ids = rawIds.split(',').map((x: string) => x.trim()).filter(Boolean);
            }
          }
          const byId = new Map<string, any>();
          for (const a of prelim) byId.set(String(a.agent_id || a.id), a);
          for (const id of ids) {
            if (!byId.has(String(id))) {
              byId.set(String(id), { agent_id: String(id), name: `Agent ${id}`, client_id: clientId });
            }
          }
          const merged = Array.from(byId.values());
          if (active) setAllClientAgents(merged);
        } catch {
          if (active) setAllClientAgents(prelim);
        }
      } catch {
        if (active) setAllClientAgents([]);
      }
    }
    loadAgents();
    return () => { active = false; };
  }, [clientId]);

  // Frontend fallback and normalization to include ALL client agents (0-activity too) and correct success logic
  React.useEffect(() => {
    async function fallbackIfEmpty() {
      if (data && (data.totals?.totalCalls ?? 0) > 0) {
        // even if backend has data, ensure zero-activity agents are present
        try {
          const agentIdSet = new Set((data.agents || []).map((a: any) => String(a.agentId || a.agent_id)));
          const missing = allClientAgents.filter((a: any) => !agentIdSet.has(String(a.agent_id))).map((a: any) => ({ agentId: String(a.agent_id), agentName: a.name || a.agent_name || String(a.agent_id), totalCalls: 0, successCount: 0, successRate: 0, totalDurationSecs: 0, avgDurationSecs: 0 }));
          if (missing.length > 0) {
            const mergedAgents = [...(data.agents || []), ...missing];
            const totals = mergedAgents.reduce((acc: any, x: any) => { acc.totalCalls += x.totalCalls || 0; acc.successCount += x.successCount || 0; acc.totalDurationSecs += x.totalDurationSecs || 0; return acc; }, { totalCalls: 0, successCount: 0, totalDurationSecs: 0 });
            totals.successRate = totals.totalCalls > 0 ? Math.round((totals.successCount / totals.totalCalls) * 100) : 0;
            const usedAgents = mergedAgents.filter((a: any) => (a.totalCalls || 0) > 0).length;
            setData({ agents: mergedAgents, totals });
            onTotalsChange?.({ ...totals, usedAgents }, mergedAgents.length);
          } else {
            const usedAgents = (data.agents || []).filter((a: any) => (a.totalCalls || 0) > 0).length;
            onTotalsChange?.({ ...(data.totals || { totalCalls: 0, successRate: 0, totalDurationSecs: 0 }), usedAgents }, (data.agents || []).length);
          }
        } catch {}
        return;
      }
      try {
        // 1) get all agents and filter by client
        const agentsRes = await fetch('/api/agents', { credentials: 'include' });
        const agentsJson = await agentsRes.json();
        const allAgents = Array.isArray(agentsJson?.data) ? agentsJson.data : [];
        const clientAgents = allAgents.filter((a: any) => String(a.client_id || '') === String(clientId) || (a.created_by_type === 'client' && String(a.created_by) === String(clientId)));
        if (clientAgents.length === 0) return;

        // 2) Fetch ALL conversations for the last 30 days (no agent filter), then filter for client's agents
        const clientAgentIdSet = new Set(clientAgents.map((a: any) => String(a.agent_id || a.id)));
        const end = Math.floor(Date.now() / 1000);
        const start = end - 30 * 24 * 60 * 60;
        let cursor: string | undefined = undefined;
        let loops = 0;
        const convs: any[] = [];
        do {
          const resp = await elevenLabsApi.listConversations({ call_start_after_unix: start, call_start_before_unix: end, page_size: 100, summary_mode: 'include', ...(cursor ? { cursor } : {}) } as any);
          if (!resp.ok) break;
          const json = await resp.json();
          const list = Array.isArray(json.conversations) ? json.conversations : [];
          convs.push(...list);
          cursor = json.next_cursor || json.cursor || undefined;
          loops += 1;
        } while (cursor && loops < 100);

        const filtered = convs.filter((c: any) => clientAgentIdSet.has(String(c.agent_id || c.agent?.id || c.agentId)));
        const perAgentMap = new Map<string, any>();
        for (const c of filtered) {
          const id = String(c.agent_id || c.agent?.id || c.agentId);
          const name = c.agent_name || c.agent?.name || id;
          const e = perAgentMap.get(id) || { agentId: id, agentName: name, totalCalls: 0, successCount: 0, totalDurationSecs: 0 };
          e.totalCalls += 1;
          // Normalize success using Reports page mapping
          const candidates = [c.call_successful, c.status, c.call_status, c.analysis?.call_successful, c.metadata?.call_successful].filter(Boolean);
          const normalized = String((candidates.length ? candidates[0] : 'unknown')).toLowerCase().trim();
          const successValues = ['successful', 'success', 'true', '1', 'completed'];
          if (successValues.includes(normalized)) e.successCount += 1;
          e.totalDurationSecs += (c.call_duration_secs || 0);
          perAgentMap.set(id, e);
        }
        // Ensure zero-activity agents are present
        for (const a of clientAgents) {
          const id = String(a.agent_id || a.id);
          if (!perAgentMap.has(id)) {
            perAgentMap.set(id, { agentId: id, agentName: a.name || a.agent_name || id, totalCalls: 0, successCount: 0, totalDurationSecs: 0 });
          }
        }
        const perAgent = Array.from(perAgentMap.values()).map(a => ({ ...a, successRate: a.totalCalls > 0 ? Math.round((a.successCount / a.totalCalls) * 100) : 0, avgDurationSecs: a.totalCalls > 0 ? Math.round(a.totalDurationSecs / a.totalCalls) : 0 }));
        const totals = perAgent.reduce((acc: any, x: any) => { acc.totalCalls += x.totalCalls; acc.successCount += x.successCount; acc.totalDurationSecs += x.totalDurationSecs; return acc; }, { totalCalls: 0, successCount: 0, totalDurationSecs: 0 });
        totals.successRate = totals.totalCalls > 0 ? Math.round((totals.successCount / totals.totalCalls) * 100) : 0;
        const usedAgents = perAgent.filter((a: any) => (a.totalCalls || 0) > 0).length;
        setData({ agents: perAgent, totals });
        onTotalsChange?.({ ...totals, usedAgents }, perAgent.length);
      } catch {}
    }
    fallbackIfEmpty();
  }, [clientId, data, allClientAgents, onTotalsChange]);

  if (loading) return <div className="text-sm text-muted-foreground">Loading analytics…</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Total Calls: <strong>{data.totals.totalCalls}</strong> • Success Rate: <strong>{data.totals.successRate}%</strong> • Total Duration: <strong>{Math.round((data.totals.totalDurationSecs||0)/60)} min</strong>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Agent</th>
              <th className="py-2 pr-4">Calls</th>
              <th className="py-2 pr-4">Success</th>
              <th className="py-2 pr-4">Success Rate</th>
              <th className="py-2 pr-4">Avg Duration</th>
            </tr>
          </thead>
          <tbody>
            {data.agents.map((a) => (
              <tr key={a.agentId} className="border-b last:border-0">
                <td className="py-2 pr-4">{a.agentName}</td>
                <td className="py-2 pr-4">{a.totalCalls}</td>
                <td className="py-2 pr-4">{a.successCount}</td>
                <td className="py-2 pr-4">{typeof a.successRate === 'number' ? a.successRate : (a.totalCalls > 0 ? Math.round(((a.successCount || 0) / a.totalCalls) * 100) : 0)}%</td>
                <td className="py-2 pr-4">{Math.round(((typeof a.avgDurationSecs === 'number' ? a.avgDurationSecs : (a.totalCalls > 0 ? Math.round((a.totalDurationSecs || 0) / a.totalCalls) : 0)) || 0)/60)} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
