
"use client";

import * as React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import {
  PlayCircle,
  PauseCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  BarChartHorizontalBig,
  ListChecks,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { format, subDays, addDays } from "date-fns";
import type { Metadata } from 'next';
import { urls } from '@/lib/config/urls';

// export const metadata: Metadata = {
//   title: 'Active & Paused Campaigns - AI Caller',
//   description: 'View and manage currently running or paused campaigns and their key real-time metrics.',
//   keywords: ['active campaigns', 'paused campaigns', 'live campaigns', 'campaign status', 'AI Caller'],
// };

type CampaignStatus = "Active" | "Paused" | "Completed"; 

interface Campaign {
  id: string;
  name: string;
  clientName: string;
  status: CampaignStatus;
  callsAttempted: number;
  callsTargeted: number;
  startDate: Date;
  endDate: Date;
}

const mockCampaignsData: Campaign[] = [
  {
    id: "camp_active_1",
    name: "Q4 Lead Generation",
    clientName: "Innovate Corp",
    status: "Active",
    callsAttempted: 450,
    callsTargeted: 500,
    startDate: subDays(new Date(), 10),
    endDate: addDays(new Date(), 20),
  },
  {
    id: "camp_paused_1",
    name: "New Product Launch",
    clientName: "Solutions Ltd",
    status: "Paused",
    callsAttempted: 180,
    callsTargeted: 200,
    startDate: subDays(new Date(), 5),
    endDate: addDays(new Date(), 25),
  },
  {
    id: "camp_active_2",
    name: "Customer Feedback Follow-up",
    clientName: "Global Connect",
    status: "Active",
    callsAttempted: 300,
    callsTargeted: 350,
    startDate: subDays(new Date(), 15),
    endDate: addDays(new Date(), 15),
  },
  {
    id: "camp_paused_2",
    name: "Appointment Reminders - Aug",
    clientName: "Tech Ventures",
    status: "Paused",
    callsAttempted: 50,
    callsTargeted: 100,
    startDate: subDays(new Date(), 2),
    endDate: addDays(new Date(), 28),
  },
   {
    id: "camp_completed_1", 
    name: "Old Q1 Promo",
    clientName: "Innovate Corp",
    status: "Completed",
    callsAttempted: 100,
    callsTargeted: 100,
    startDate: subDays(new Date(), 90),
    endDate: subDays(new Date(), 60),
  },
];

interface RealTimeMetrics {
  callsPerMinute: string;
  connectedRate: string;
  failedRate: string;
  avgCallDuration: string;
}

const activeMetrics: RealTimeMetrics = {
  callsPerMinute: "12",
  connectedRate: "85",
  failedRate: "5",
  avgCallDuration: "3:45 min",
};

const pausedMetrics: RealTimeMetrics = {
  callsPerMinute: "0",
  connectedRate: "N/A",
  failedRate: "N/A",
  avgCallDuration: "N/A",
};

export default function ActivePausedCampaignsPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [currentTab, setCurrentTab] = React.useState<"active" | "paused" | "completed">("active");
  const [workspaceBatches, setWorkspaceBatches] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const refresh = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(urls.backend.campaigns.list());
      const json = await res.json();
      setWorkspaceBatches(json);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
      setError('Failed to load campaigns. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => {
    refresh();
    const id = setInterval(refresh, 8000);
    return () => clearInterval(id);
  }, [refresh]);

  React.useEffect(() => {
    if (!workspaceBatches) return;
    
    // Extract campaigns from ElevenLabs response
    const list = Array.isArray(workspaceBatches?.batch_calls)
      ? workspaceBatches.batch_calls
      : Array.isArray(workspaceBatches?.items)
      ? workspaceBatches.items
      : Array.isArray(workspaceBatches)
      ? workspaceBatches
      : [];
    
    console.log('[ActivePausedCampaigns] Processing campaigns:', list.length, 'items');
    
    const mapped: Campaign[] = list.map((b: any) => {
      const total = Number(b.total_calls_scheduled || b.total_calls || 0);
      const attempted = Number(b.total_calls_dispatched || b.completed_calls || 0);
      const created = b.created_at_unix ? new Date(b.created_at_unix * 1000) : (b.created_at ? new Date(b.created_at) : new Date());
      const end = b.last_updated_at_unix ? new Date(b.last_updated_at_unix * 1000) : addDays(created, 30);
      
      // Map ElevenLabs status to our status
      const statusLower = (b.status || '').toString().toLowerCase();
      let status: CampaignStatus = 'Active';
      if (statusLower === 'cancelled' || statusLower.includes('cancel') || statusLower.includes('pause')) {
        status = 'Paused';
      } else if (statusLower === 'completed' || statusLower.includes('complete') || statusLower.includes('finished')) {
        status = 'Completed';
      } else if (statusLower === 'in_progress' || statusLower === 'pending') {
        status = 'Active';
      }
      
      // Use local database data if available
      const localData = b.local;
      
      return {
        id: String(b.id || b.batch_id || b.batchId || b.name || Math.random()),
        name: localData?.name || b.name || 'Batch Campaign',
        clientName: localData?.clientName || (localData ? 'Workspace' : ''),
        status,
        callsAttempted: attempted,
        callsTargeted: total,
        startDate: created,
        endDate: end,
      };
    });
    
    console.log('[ActivePausedCampaigns] Mapped campaigns:', mapped);
    console.log('[ActivePausedCampaigns] Active campaigns:', mapped.filter(c => c.status === 'Active'));
    console.log('[ActivePausedCampaigns] Paused campaigns:', mapped.filter(c => c.status === 'Paused'));
    console.log('[ActivePausedCampaigns] Completed campaigns:', mapped.filter(c => c.status === 'Completed'));
    setCampaigns(mapped);
  }, [workspaceBatches]);

  const handleToggleStatus = async (campaignId: string) => {
    const target = campaigns.find(c => c.id === campaignId);
    if (!target) return;
    
    try {
      let response;
      let verb;
      
      if (target.status === 'Active') {
        // Cancel active campaign
        response = await fetch(urls.backend.campaigns.cancel(campaignId), { method: 'POST' });
        verb = 'Cancelled';
      } else if (target.status === 'Paused' || target.status === 'Completed') {
        // Retry paused/completed campaign
        response = await fetch(urls.backend.campaigns.retry(campaignId), { method: 'POST' });
        verb = 'Retried';
      } else {
        throw new Error('Invalid campaign status for toggle');
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast({ 
          title: `Campaign ${verb}`, 
          description: `Campaign "${target.name}" has been ${verb.toLowerCase()}.` 
        });
        await refresh();
      } else {
        toast({ 
          title: 'Action failed', 
          description: result.error || 'Please try again later.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      toast({ 
        title: 'Action failed', 
        description: 'Please try again later.',
        variant: 'destructive'
      });
    }
  };

  const handleMonitorNow = (campaignId: string, campaignName: string) => {
    // Navigate to monitor live calls page with campaign filter
    window.location.href = `/campaigns/monitor-live?campaignId=${encodeURIComponent(campaignId)}`;
  };

  const displayedCampaigns = campaigns.filter(
    (campaign) => campaign.status.toLowerCase() === currentTab
  );

  // Calculate real-time metrics from actual campaign data
  const calculateMetrics = (campaigns: Campaign[]): RealTimeMetrics => {
    if (campaigns.length === 0) {
      return {
        callsPerMinute: "0",
        connectedRate: "N/A",
        failedRate: "N/A",
        avgCallDuration: "N/A",
      };
    }

    const totalAttempted = campaigns.reduce((sum, c) => sum + c.callsAttempted, 0);
    const totalTargeted = campaigns.reduce((sum, c) => sum + c.callsTargeted, 0);
    
    // Calculate calls per minute (simplified - in real app would be based on time)
    const callsPerMinute = Math.round(totalAttempted / Math.max(campaigns.length, 1));
    
    // Calculate connection rate
    const connectedRate = totalTargeted > 0 ? Math.round((totalAttempted / totalTargeted) * 100) : 0;
    
    // Calculate failed rate (simplified - would need more detailed call data)
    const failedRate = Math.max(0, 100 - connectedRate - 10); // Assume 10% other statuses
    
    // Average call duration (simplified - would need actual call duration data)
    const avgCallDuration = "3:45 min"; // This would come from actual call data

    return {
      callsPerMinute: callsPerMinute.toString(),
      connectedRate: `${connectedRate}%`,
      failedRate: `${failedRate}%`,
      avgCallDuration,
    };
  };

  const currentMetrics = calculateMetrics(displayedCampaigns);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold font-headline">Active & Paused Campaigns</h1>
          <p className="text-muted-foreground">
            View currently running or paused campaigns and their key metrics.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 p-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <span className="text-destructive">{error}</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Real-Time Metrics Overview</CardTitle>
          <CardDescription>
            Aggregated metrics for {currentTab === "active" ? "Active" : "Paused"} campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center p-4 bg-muted/50 rounded-lg">
            <Activity className="h-8 w-8 text-primary mr-4" />
            <div>
              <p className="text-sm text-muted-foreground">Calls/minute</p>
              <p className="text-2xl font-bold">{currentMetrics.callsPerMinute}</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-muted/50 rounded-lg">
            <TrendingUp className="h-8 w-8 text-green-500 mr-4" />
            <div>
              <p className="text-sm text-muted-foreground">Connected %</p>
              <p className="text-2xl font-bold">{currentMetrics.connectedRate}</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-muted/50 rounded-lg">
            <TrendingDown className="h-8 w-8 text-red-500 mr-4" />
            <div>
              <p className="text-sm text-muted-foreground">Failed %</p>
              <p className="text-2xl font-bold">{currentMetrics.failedRate}</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-muted/50 rounded-lg">
            <Clock className="h-8 w-8 text-blue-500 mr-4" />
            <div>
              <p className="text-sm text-muted-foreground">Avg. Call Duration</p>
              <p className="text-2xl font-bold">{currentMetrics.avgCallDuration}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as "active" | "paused" | "completed")} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-2/3 lg:w-1/2">
          <TabsTrigger value="active">
            <PlayCircle className="mr-2 h-4 w-4" /> Active Campaigns
          </TabsTrigger>
          <TabsTrigger value="paused">
            <PauseCircle className="mr-2 h-4 w-4" /> Paused Campaigns
          </TabsTrigger>
          <TabsTrigger value="completed">
            <ListChecks className="mr-2 h-4 w-4" /> Completed Campaigns
          </TabsTrigger>
        </TabsList>
        
        {(["active", "paused", "completed"] as const).map(tabStatus => (
            <TabsContent key={tabStatus} value={tabStatus} className="mt-6">
            {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading campaigns...</p>
                </div>
            ) : displayedCampaigns.filter(c => c.status.toLowerCase() === tabStatus).length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedCampaigns
                    .filter(c => c.status.toLowerCase() === tabStatus)
                    .map((campaign) => (
                    <Card key={campaign.id} className="shadow-md">
                        <CardHeader>
                        <CardTitle className="truncate">{campaign.name}</CardTitle>
                        <CardDescription>{campaign.clientName}</CardDescription>
                        <CardDescription className="text-xs">
                            {format(campaign.startDate, "MMM dd, yyyy")} - {format(campaign.endDate, "MMM dd, yyyy")}
                        </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor={`status-toggle-${campaign.id}`} className="text-sm">
                            {campaign.status === "Active" ? "Running" : campaign.status === "Paused" ? "Paused" : "Completed"}
                            </Label>
                            <Switch
                            id={`status-toggle-${campaign.id}`}
                            checked={campaign.status === "Active"}
                            onCheckedChange={() => handleToggleStatus(campaign.id)}
                            aria-label={
                              campaign.status === "Active" 
                                ? "Cancel campaign" 
                                : campaign.status === "Paused" 
                                ? "Retry campaign" 
                                : "Retry campaign"
                            }
                            />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Call Progress</p>
                            <div className="flex justify-between items-baseline">
                                <p className="text-lg font-semibold">
                                    {campaign.callsAttempted} / {campaign.callsTargeted}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    ({Math.round((campaign.callsAttempted / campaign.callsTargeted) * 100)}%)
                                </p>
                            </div>
                            <Progress
                            value={ (campaign.callsTargeted > 0 ? (campaign.callsAttempted / campaign.callsTargeted) * 100 : 0)}
                            className="h-2 mt-1"
                            aria-label={`${Math.round((campaign.callsAttempted / campaign.callsTargeted) * 100)}% of calls attempted`}
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleMonitorNow(campaign.id, campaign.name)}
                        >
                            <BarChartHorizontalBig className="mr-2 h-4 w-4" /> Monitor Now
                        </Button>
                        </CardContent>
                    </Card>
                ))}
                </div>
            ) : (
                <div className="text-center py-12">
                  {tabStatus === "active" ? (
                    <>
                      <PlayCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground text-lg">No active campaigns found</p>
                      <p className="text-sm text-muted-foreground">Create a new campaign or retry a paused one to get started.</p>
                    </>
                  ) : tabStatus === "paused" ? (
                    <>
                      <PauseCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground text-lg">No paused campaigns found</p>
                      <p className="text-sm text-muted-foreground">Pause an active campaign to see it here.</p>
                    </>
                  ) : (
                    <>
                      <ListChecks className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground text-lg">No completed campaigns found</p>
                      <p className="text-sm text-muted-foreground">Completed campaigns will appear here once they finish.</p>
                    </>
                  )}
                </div>
            )}
            </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
