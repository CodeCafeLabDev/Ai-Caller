"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Megaphone, 
  Play, 
  Pause, 
  RefreshCw, 
  AlertCircle, 
  TrendingUp, 
  Phone, 
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useUser } from "@/lib/utils";
import { urls } from "@/lib/config/urls";
import { addDays } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

// Campaign interface
interface Campaign {
  id: string;
  name: string;
  clientName: string;
  clientId: string;
  agentName?: string;
  tags: string[];
  type: 'Outbound' | 'Inbound';
  callsAttempted: number;
  callsTargeted: number;
  startDate: Date;
  endDate: Date;
  status: 'Active' | 'Paused' | 'Completed';
  successRate: number;
  representativePhoneNumber?: string;
}

type CampaignStatus = 'Active' | 'Paused' | 'Completed';

export default function ClientActivePausedCampaignsPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentTab, setCurrentTab] = React.useState<"active" | "paused" | "completed">("active");

  // Fetch campaigns for the current client
  const refresh = React.useCallback(async () => {
    if (!user?.clientId && !user?.userId) {
      console.log('[ClientActivePaused] No client ID found in user:', user);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const clientId = user.clientId || user.userId;
      console.log('[ClientActivePaused] Fetching campaigns for client:', clientId);
      
      const res = await fetch(urls.backend.campaigns.listForClient(clientId));
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch campaigns');
      }

      // Map the data similar to main campaigns page
      const list = Array.isArray(json?.batch_calls) ? json.batch_calls : [];
      const localOnly = Array.isArray(json?.local_only) ? json.local_only : [];
      
      // Map ElevenLabs campaigns with local data
      const mapped: Campaign[] = list.map((b: any) => {
        const total = Number(b.total_calls_scheduled || b.total_calls || 0);
        const attempted = Number(b.total_calls_dispatched || 0);
        const created = b.created_at_unix ? new Date(b.created_at_unix * 1000) : (b.created_at ? new Date(b.created_at) : new Date());
        const end = b.last_updated_at_unix ? new Date(b.last_updated_at_unix * 1000) : addDays(created, 30);
        const statusLower = (b.status || '').toString().toLowerCase();
        const status: CampaignStatus = statusLower.includes('cancel') ? 'Paused' : statusLower.includes('complete') ? 'Completed' : 'Active';
        
        const localData = b.local;
        
        return {
          id: String(b.id || b.batch_id || b.batchId || b.name || Math.random()),
          name: localData?.name || b.name || 'Campaign',
          clientName: localData?.clientName || b.client_name || '',
          clientId: localData?.clientId || clientId,
          agentName: localData?.agentName || b.agent_name || undefined,
          tags: [],
          type: 'Outbound' as const,
          callsAttempted: attempted,
          callsTargeted: total,
          startDate: created,
          endDate: end,
          status,
          successRate: total > 0 ? Math.round((attempted / total) * 100) : 0,
          representativePhoneNumber: undefined,
        };
      });
      
      // Also map local-only campaigns
      const localMapped: Campaign[] = localOnly.map((l: any) => {
        const created = l.createdAt ? new Date(l.createdAt) : new Date();
        const end = l.updatedAt ? new Date(l.updatedAt) : addDays(created, 30);
        
        return {
          id: String(l.id || Math.random()),
          name: l.name || 'Local Campaign',
          clientName: l.clientName || '',
          clientId: l.clientId || clientId,
          agentName: l.agentName || undefined,
          tags: [],
          type: 'Outbound' as const,
          callsAttempted: l.callsAttempted || 0,
          callsTargeted: l.callsTargeted || 0,
          startDate: created,
          endDate: end,
          status: l.status || 'Active',
          successRate: l.successRate || 0,
          representativePhoneNumber: undefined,
        };
      });
      
      const allCampaigns = [...mapped, ...localMapped];
      setCampaigns(allCampaigns);
    } catch (err: any) {
      console.error('[ClientActivePaused] Error fetching campaigns:', err);
      setError(err.message || 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  }, [user?.clientId, user?.userId]);

  // Initial load and periodic refresh
  React.useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000); // Refresh every 30 seconds
    return () => clearInterval(id);
  }, [refresh]);

  // Filter campaigns by status
  const getCampaignsByStatus = (status: CampaignStatus) => {
    return campaigns.filter(campaign => campaign.status === status);
  };

  const activeCampaigns = getCampaignsByStatus('Active');
  const pausedCampaigns = getCampaignsByStatus('Paused');
  const completedCampaigns = getCampaignsByStatus('Completed');

  // Calculate metrics
  const calculateMetrics = () => {
    const active = activeCampaigns.length;
    const paused = pausedCampaigns.length;
    const completed = completedCampaigns.length;
    const totalCalls = campaigns.reduce((sum, c) => sum + c.callsAttempted, 0);
    const avgSuccessRate = campaigns.length > 0 
      ? Math.round(campaigns.reduce((sum, c) => sum + c.successRate, 0) / campaigns.length)
      : 0;

    return { active, paused, completed, totalCalls, avgSuccessRate };
  };

  const metrics = calculateMetrics();

  const handleToggleStatus = async (campaignId: string, currentStatus: CampaignStatus, campaignName: string) => {
    try {
      const action = currentStatus === 'Active' ? 'cancel' : 'retry';
      const res = await fetch(urls.backend.campaigns[action](campaignId), { method: 'POST' });
      
      if (res.ok) {
        const newStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
        toast({ 
          title: `Campaign ${newStatus === 'Active' ? 'Resumed' : 'Paused'}`, 
          description: `Campaign "${campaignName}" has been ${newStatus === 'Active' ? 'resumed' : 'paused'} successfully.` 
        });
        refresh(); // Refresh the list
      } else {
        throw new Error(`Failed to ${action} campaign`);
      }
    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err.message || `Failed to ${currentStatus === 'Active' ? 'pause' : 'resume'} campaign`, 
        variant: "destructive" 
      });
    }
  };

  const handleMonitorNow = (campaignId: string) => {
    // Navigate to monitor page with campaign filter
    window.location.href = `/client-admin/campaigns/monitor-live?campaignId=${encodeURIComponent(campaignId)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <Megaphone className="mr-2 h-7 w-7" /> My Campaign Status
          </h1>
          <p className="text-muted-foreground">Monitor and control your active, paused, and completed campaigns.</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.active}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused Campaigns</CardTitle>
            <Pause className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.paused}</div>
            <p className="text-xs text-muted-foreground">Temporarily stopped</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completed}</div>
            <p className="text-xs text-muted-foreground">Finished campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCalls}</div>
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Tabs */}
      <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as typeof currentTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Active ({activeCampaigns.length})
          </TabsTrigger>
          <TabsTrigger value="paused" className="flex items-center gap-2">
            <Pause className="h-4 w-4" />
            Paused ({pausedCampaigns.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed ({completedCampaigns.length})
          </TabsTrigger>
        </TabsList>

        {["active", "paused", "completed"].map((tab) => {
          const tabCampaigns = tab === "active" ? activeCampaigns : tab === "paused" ? pausedCampaigns : completedCampaigns;
          const statusLabel = tab === "active" ? "Active" : tab === "paused" ? "Paused" : "Completed";
          
          return (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading campaigns...</span>
                </div>
              ) : tabCampaigns.length > 0 ? (
                <div className="grid gap-4">
                  {tabCampaigns.map((campaign) => (
                    <Card key={campaign.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{campaign.name}</CardTitle>
                            <CardDescription>
                              {campaign.agentName && `Agent: ${campaign.agentName}`}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={tab === "active" ? "default" : tab === "paused" ? "secondary" : "outline"}>
                              {statusLabel}
                            </Badge>
                            {tab !== "completed" && (
                              <Switch
                                checked={tab === "active"}
                                onCheckedChange={() => handleToggleStatus(campaign.id, campaign.status, campaign.name)}
                                aria-label={`Toggle campaign ${campaign.name}`}
                              />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Progress</p>
                            <p className="text-2xl font-bold">{campaign.callsAttempted}/{campaign.callsTargeted}</p>
                            <p className="text-xs text-muted-foreground">calls made</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Success Rate</p>
                            <p className="text-2xl font-bold">{campaign.successRate}%</p>
                            <p className="text-xs text-muted-foreground">completion rate</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Start Date</p>
                            <p className="text-sm font-medium">{campaign.startDate.toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">campaign launch</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Actions</p>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleMonitorNow(campaign.id)}
                              >
                                <TrendingUp className="mr-1 h-3 w-3" />
                                Monitor
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    {tab === "active" && <Play className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />}
                    {tab === "paused" && <Pause className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />}
                    {tab === "completed" && <CheckCircle className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />}
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      No {statusLabel.toLowerCase()} campaigns
                    </h3>
                    <p className="text-sm text-muted-foreground text-center">
                      {tab === "active" && "Start a new campaign to see active campaigns here."}
                      {tab === "paused" && "Pause an active campaign to see it here."}
                      {tab === "completed" && "Completed campaigns will appear here."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
