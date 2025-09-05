"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Phone, 
  PhoneCall, 
  RefreshCw, 
  AlertCircle, 
  TrendingUp, 
  Clock,
  User,
  MapPin,
  MessageSquare,
  Volume2,
  AlertTriangle,
  MoreHorizontal
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/lib/utils";
import { urls } from "@/lib/config/urls";
import { useToast } from "@/components/ui/use-toast";

// Live call interface
interface LiveCall {
  id: string;
  campaignId: string;
  campaignName: string;
  callerId: string;
  agent: string;
  status: 'Dialing' | 'Answered' | 'Failed' | 'Completed';
  duration: number; // in seconds
  startTime: Date;
  endTime?: Date;
  conversationId?: string;
  phoneProvider?: string;
  totalCallsScheduled?: number;
  totalCallsDispatched?: number;
}

export default function ClientMonitorLiveCallsPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const [liveCalls, setLiveCalls] = React.useState<LiveCall[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Get campaign ID from URL params
  const [campaignId, setCampaignId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('campaignId');
    setCampaignId(id);
  }, []);

  // Fetch live calls data
  const refresh = React.useCallback(async () => {
    if (!user?.clientId && !user?.userId) {
      console.log('[ClientMonitorLive] No client ID found in user:', user);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const clientId = user.clientId || user.userId;
      console.log('[ClientMonitorLive] Fetching live calls for client:', clientId);
      
      // Fetch campaigns for this client first
      const campaignsRes = await fetch(urls.backend.campaigns.listForClient(clientId));
      const campaignsData = await campaignsRes.json();
      
      if (!campaignsRes.ok) {
        throw new Error(campaignsData.error || 'Failed to fetch campaigns');
      }

      // Filter campaigns if specific campaign ID is provided
      let clientCampaigns = campaignsData.batch_calls || [];
      if (campaignId) {
        clientCampaigns = clientCampaigns.filter((c: any) => 
          String(c.id || c.batch_id) === String(campaignId)
        );
      }

      // Fetch live calls data
      const liveCallsRes = await fetch(urls.backend.campaigns.liveCalls());
      const liveCallsData = await liveCallsRes.json();
      
      if (!liveCallsRes.ok) {
        throw new Error(liveCallsData.error || 'Failed to fetch live calls');
      }

      // Filter live calls to only show those from client's campaigns
      const clientCampaignIds = new Set(
        clientCampaigns.map((c: any) => String(c.id || c.batch_id))
      );

      const filteredLiveCalls = (liveCallsData.liveCalls || []).filter((call: any) => 
        clientCampaignIds.has(String(call.campaignId))
      );

      // Map to LiveCall interface
      const mapped: LiveCall[] = filteredLiveCalls.map((call: any) => ({
        id: call.id || call.callId || Math.random().toString(),
        campaignId: call.campaignId || call.batchId || '',
        campaignName: call.campaignName || call.batchName || 'Unknown Campaign',
        callerId: call.callerId || call.phoneNumber || '',
        agent: call.agent || call.agentName || 'Unknown Agent',
        status: call.status || 'Dialing',
        duration: call.duration || 0,
        startTime: call.startTime ? new Date(call.startTime) : new Date(),
        endTime: call.endTime ? new Date(call.endTime) : undefined,
        conversationId: call.conversationId,
        phoneProvider: call.phoneProvider,
        totalCallsScheduled: call.totalCallsScheduled,
        totalCallsDispatched: call.totalCallsDispatched,
      }));

      setLiveCalls(mapped);
    } catch (err: any) {
      console.error('[ClientMonitorLive] Error fetching live calls:', err);
      setError(err.message || 'Failed to fetch live calls');
    } finally {
      setLoading(false);
    }
  }, [user?.clientId, user?.userId, campaignId]);

  // Initial load and periodic refresh
  React.useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10000); // Refresh every 10 seconds
    return () => clearInterval(id);
  }, [refresh]);

  // Filter calls based on search term
  const filteredCalls = React.useMemo(() => {
    return liveCalls.filter(call => 
      call.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.callerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.agent.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [liveCalls, searchTerm]);

  // Calculate metrics
  const metrics = React.useMemo(() => {
    const total = liveCalls.length;
    const active = liveCalls.filter(c => c.status === 'Answered' || c.status === 'Dialing').length;
    const completed = liveCalls.filter(c => c.status === 'Completed').length;
    const failed = liveCalls.filter(c => c.status === 'Failed').length;
    const avgDuration = total > 0 
      ? Math.round(liveCalls.reduce((sum, c) => sum + c.duration, 0) / total)
      : 0;

    return { total, active, completed, failed, avgDuration };
  }, [liveCalls]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Answered': return 'bg-green-100 text-green-700';
      case 'Dialing': return 'bg-blue-100 text-blue-700';
      case 'Completed': return 'bg-gray-100 text-gray-700';
      case 'Failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleViewTranscript = (call: LiveCall) => {
    if (call.conversationId) {
      // Open transcript in a new tab or modal
      window.open(`/client-admin/campaigns/transcript/${call.conversationId}`, '_blank');
    } else {
      toast({ title: "No Transcript", description: "Transcript not available for this call." });
    }
  };

  const handleListenRecording = (call: LiveCall) => {
    if (call.conversationId) {
      // Open recording in a new tab or modal
      window.open(`/client-admin/campaigns/recording/${call.conversationId}`, '_blank');
    } else {
      toast({ title: "No Recording", description: "Recording not available for this call." });
    }
  };

  const handleFlagMisuse = (call: LiveCall) => {
    // Implement flag misuse functionality
    toast({ title: "Flag Misuse", description: `Flagged call ${call.callerId} for review.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <PhoneCall className="mr-2 h-7 w-7" /> Live Call Monitor
          </h1>
          <p className="text-muted-foreground">
            {campaignId 
              ? `Monitoring live calls for campaign ${campaignId}` 
              : "Monitor live calls across all your campaigns"
            }
          </p>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground">All calls</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.active}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completed}</div>
            <p className="text-xs text-muted-foreground">Finished</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.failed}</div>
            <p className="text-xs text-muted-foreground">Unsuccessful</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(metrics.avgDuration)}</div>
            <p className="text-xs text-muted-foreground">Per call</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Calls Table */}
      <Card>
        <CardHeader>
          <CardTitle>Live Calls</CardTitle>
          <CardDescription>Real-time monitoring of active calls</CardDescription>
          <div className="flex items-center gap-4 pt-4">
            <Input 
              placeholder="Search calls..." 
              className="max-w-sm" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Caller ID</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading live calls...</p>
                  </TableCell>
                </TableRow>
              ) : filteredCalls.length > 0 ? (
                filteredCalls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell className="font-medium">{call.campaignName}</TableCell>
                    <TableCell>{call.callerId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {call.agent}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${getStatusColor(call.status)}`}>
                        {call.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDuration(call.duration)}</TableCell>
                    <TableCell>{call.startTime.toLocaleTimeString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewTranscript(call)}>
                            <MessageSquare className="mr-2 h-4 w-4" /> View Transcript
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleListenRecording(call)}>
                            <Volume2 className="mr-2 h-4 w-4" /> Listen Recording
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleFlagMisuse(call)}>
                            <AlertTriangle className="mr-2 h-4 w-4" /> Flag Misuse
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <PhoneCall className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground text-lg">No active calls found</p>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm 
                        ? "Try adjusting your search criteria." 
                        : "Live calls will appear here when campaigns are running."}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
