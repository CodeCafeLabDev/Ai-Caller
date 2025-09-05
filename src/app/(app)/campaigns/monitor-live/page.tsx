
"use client";

import * as React from "react";
import { urls } from '@/lib/config/urls';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MoreHorizontal,
  FileText,
  PlayCircle,
  AlertTriangle,
  PhoneCall,
  Users,
  Timer,
  Info,
  AlertCircle as LogWarning,
  XCircle as LogError,
  CheckCircle2,
  PhoneForwarded,
  PhoneOff,
  PhoneOutgoing
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/cn";
import { formatDistanceToNow } from "date-fns";
import type { Metadata } from 'next';
import elevenLabsApi from "@/lib/elevenlabsApi";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// export const metadata: Metadata = {
//   title: 'Monitor Live Calls - AI Caller',
//   description: 'Real-time insights into your calling operations, including live call tracking and system logs.',
//   keywords: ['live calls', 'call monitoring', 'real-time analytics', 'call center', 'AI Caller'],
// };


type CallStatus = "Dialing" | "Answered" | "In Progress" | "Failed" | "Completed";
type LogType = "info" | "warning" | "error";

interface LiveCall {
  id: string;
  callerId: string;
  campaignName: string;
  clientName: string;
  status: CallStatus;
  durationSeconds: number;
  agent?: string;
  transcriptionSnippet?: string;
  conversationId?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: LogType;
}

const initialLiveCalls: LiveCall[] = [
  { id: "call_1", callerId: "555-0101", campaignName: "Q4 Lead Gen", clientName: "Innovate Corp", status: "Answered", durationSeconds: 125, agent: "AI-Agent-01", transcriptionSnippet: "Hello, I'm calling about..." },
  { id: "call_2", callerId: "555-0102", campaignName: "New Product Launch", clientName: "Solutions Ltd", status: "Dialing", durationSeconds: 15, transcriptionSnippet: "Ringing..." },
  { id: "call_3", callerId: "555-0103", campaignName: "Feedback Follow-up", clientName: "Global Connect", status: "In Progress", durationSeconds: 310, agent: "AI-Agent-02", transcriptionSnippet: "Could you tell me more about..." },
  { id: "call_4", callerId: "555-0104", campaignName: "Appointment Reminders", clientName: "Tech Ventures", status: "Completed", durationSeconds: 65, transcriptionSnippet: "Your appointment is confirmed." },
  { id: "call_5", callerId: "555-0105", campaignName: "Q4 Lead Gen", clientName: "Innovate Corp", status: "Failed", durationSeconds: 30, transcriptionSnippet: "No answer." },
];

const initialLogEntries: LogEntry[] = [
  { id: "log_1", timestamp: new Date(), message: "System initialized. Monitoring started.", type: "info" },
  { id: "log_2", timestamp: new Date(Date.now() - 2000), message: "Campaign 'Q4 Lead Gen' started for Innovate Corp.", type: "info" },
  { id: "log_3", timestamp: new Date(Date.now() - 5000), message: "AI-Agent-01 connected to call 555-0101.", type: "info" },
];

const statusColors: Record<CallStatus, string> = {
  Dialing: "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100",
  Answered: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
  "In Progress": "bg-teal-100 text-teal-700 dark:bg-teal-700 dark:text-teal-100",
  Failed: "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100",
  Completed: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100",
};

const statusIcons: Record<CallStatus, React.ElementType> = {
    Dialing: PhoneOutgoing,
    Answered: PhoneCall,
    "In Progress": PhoneForwarded,
    Failed: PhoneOff,
    Completed: CheckCircle2,
};

const logIcons: Record<LogType, React.ElementType> = {
  info: Info,
  warning: LogWarning,
  error: LogError,
};

const logColors: Record<LogType, string> = {
  info: "text-blue-500",
  warning: "text-yellow-500",
  error: "text-red-500",
};

export default function MonitorLiveCallsPage() {
  const { toast } = useToast();
  const [liveCalls, setLiveCalls] = React.useState<LiveCall[]>([]);
  const [logEntries, setLogEntries] = React.useState<LogEntry[]>([]);
  
  const [totalLiveCalls, setTotalLiveCalls] = React.useState(0);
  const [activeAgents, setActiveAgents] = React.useState(0);
  const [avgResponseTime, setAvgResponseTime] = React.useState("0s");
  const [campaignId, setCampaignId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // State for transcript and recording functionality
  const [conversationSheetOpen, setConversationSheetOpen] = React.useState(false);
  const [selectedConversation, setSelectedConversation] = React.useState<any>(null);
  const [conversationDetails, setConversationDetails] = React.useState<any>(null);
  const [conversationAudioUrl, setConversationAudioUrl] = React.useState<string | null>(null);
  const [conversationLoading, setConversationLoading] = React.useState(false);
  
  // State for flag misuse functionality
  const [flagMisuseOpen, setFlagMisuseOpen] = React.useState(false);
  const [selectedCallForFlag, setSelectedCallForFlag] = React.useState<LiveCall | null>(null);
  const [flagReason, setFlagReason] = React.useState<string>("");
  const [flagDescription, setFlagDescription] = React.useState<string>("");
  const [flagLoading, setFlagLoading] = React.useState(false);

  const formatDuration = (totalSeconds: number) => {
    return `${totalSeconds}s`;
  };

  // Fetch live calls data from ElevenLabs
  const fetchLiveCallsData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[MonitorLiveCalls] Fetching live calls data...');
      const response = await fetch(urls.backend.campaigns.liveCalls());
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch live calls data');
      }
      
      console.log('[MonitorLiveCalls] Live calls data received:', result.data);
      
      // Update live calls
      if (result.data.liveCalls && Array.isArray(result.data.liveCalls)) {
        setLiveCalls(result.data.liveCalls);
      }
      
      // Update logs
      if (result.data.logs && Array.isArray(result.data.logs)) {
        setLogEntries(result.data.logs);
      }
      
      // Update metrics
      if (result.data.metrics) {
        setTotalLiveCalls(result.data.metrics.totalLiveCalls || 0);
        setActiveAgents(result.data.metrics.activeAgents || 0);
        setAvgResponseTime(result.data.metrics.avgResponseTime || '0s');
      }
      
      
    } catch (err) {
      console.error('[MonitorLiveCalls] Error fetching live calls data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch live calls data');
      
      // Clear data on error
      setLiveCalls([]);
      setLogEntries([]);
      setTotalLiveCalls(0);
      setActiveAgents(0);
      setAvgResponseTime('0s');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and periodic refresh
  React.useEffect(() => {
    fetchLiveCallsData();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchLiveCallsData, 5000);
    
    return () => clearInterval(interval);
  }, [fetchLiveCallsData]);

  // Handle campaignId from URL params
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('campaignId');
    if (id) setCampaignId(id);
  }, []);

  // Real-time duration updates for active calls
  React.useEffect(() => {
    const interval = setInterval(() => {
      setLiveCalls(prevCalls =>
        prevCalls.map(call => {
          // Only update duration for active calls
          if (["Dialing", "Answered", "In Progress"].includes(call.status)) {
            return { ...call, durationSeconds: call.durationSeconds + 1 };
          }
          return call;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []); 

  const handleCallAction = (actionName: string, callId: string) => {
    toast({
      title: `Action: ${actionName}`,
      description: `Performed on call ${callId}. (Simulated)`,
    });
  };

  // Manual refresh function
  const handleRefresh = () => {
    fetchLiveCallsData();
  };

  // Handle flag misuse functionality
  const handleFlagMisuse = (call: LiveCall) => {
    setSelectedCallForFlag(call);
    setFlagReason("");
    setFlagDescription("");
    setFlagMisuseOpen(true);
  };

  const handleSubmitFlagMisuse = async () => {
    if (!selectedCallForFlag || !flagReason || !flagDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a reason and provide a description for flagging this call.",
        variant: "destructive",
      });
      return;
    }

    setFlagLoading(true);
    
    try {
      // Create flag misuse report
      const flagReport = {
        callId: selectedCallForFlag.id,
        conversationId: selectedCallForFlag.conversationId,
        callerId: selectedCallForFlag.callerId,
        campaignName: selectedCallForFlag.campaignName,
        agent: selectedCallForFlag.agent,
        reason: flagReason,
        description: flagDescription,
        timestamp: new Date().toISOString(),
        reportedBy: "System User", // In a real app, this would be the logged-in user
        status: "pending"
      };

      // Send flag report to backend API
      const response = await fetch(urls.backend.campaigns.flagMisuse(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flagReport),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to flag call');
      }

      // Log the flag for debugging
      console.log('Flag Misuse Report:', flagReport, 'Response:', result);

      toast({
        title: "Call Flagged Successfully",
        description: `Call to ${selectedCallForFlag.callerId} has been flagged for review.`,
      });

      // Close the dialog and reset state
      setFlagMisuseOpen(false);
      setSelectedCallForFlag(null);
      setFlagReason("");
      setFlagDescription("");

    } catch (error) {
      console.error('Error flagging call:', error);
      toast({
        title: "Error",
        description: "Failed to flag the call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFlagLoading(false);
    }
  };

  // Handle viewing conversation transcript and recording
  const handleViewConversation = async (call: LiveCall) => {
    if (!call.conversationId) {
      toast({
        title: "No Conversation Data",
        description: "This call doesn't have conversation data available yet.",
      });
      return;
    }

    setConversationLoading(true);
    setConversationSheetOpen(true);
    setSelectedConversation(call);
    setConversationDetails(null);
    setConversationAudioUrl(null);

    try {
      // Fetch conversation details
      const detailsRes = await elevenLabsApi.getConversationDetails(call.conversationId);
      const details = await detailsRes.json();
      console.log('ElevenLabs Conversation Details API response:', details);
      setConversationDetails(details);

      // Fetch conversation audio
      try {
        const audioRes = await elevenLabsApi.getConversationAudio(call.conversationId);
        if (audioRes.ok) {
          const audioBlob = await audioRes.blob();
          setConversationAudioUrl(URL.createObjectURL(audioBlob));
        }
      } catch (audioError) {
        console.error('Error fetching conversation audio:', audioError);
        // Audio is optional, don't show error to user
      }
    } catch (error) {
      console.error('Error fetching conversation details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch conversation details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConversationLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline">Monitor Live Calls</h1>
          <p className="text-muted-foreground">Real-time insights into your calling operations.</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <LogError className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading live calls data</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}


      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Live Calls</CardTitle>
            <PhoneCall className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalLiveCalls}</div>
            <p className="text-xs text-muted-foreground">Currently active or dialing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeAgents}</div>
            <p className="text-xs text-muted-foreground">Human or AI agents currently on calls</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Response Time</CardTitle>
            <Timer className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgResponseTime}</div>
            <p className="text-xs text-muted-foreground">Average time to answer</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Live Call Tracker</CardTitle>
            <CardDescription>Ongoing and recently completed calls.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caller ID</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Transcription Snippet</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && liveCalls.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Loading live calls data...
                      </TableCell>
                    </TableRow>
                  ) : liveCalls.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <PhoneCall className="h-8 w-8 text-muted-foreground/50" />
                          <div>
                            <p className="font-medium">No active calls found</p>
                            <p className="text-sm">Create and start a campaign to see live call data</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    liveCalls.map((call) => {
                      const StatusIcon = statusIcons[call.status];
                      return (
                      <TableRow key={call.id}>
                        <TableCell className="font-medium">{call.callerId}</TableCell>
                        <TableCell>
                          <div>{call.campaignName}</div>
                          <div className="text-xs text-muted-foreground">{call.clientName}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs", statusColors[call.status])}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {call.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDuration(call.durationSeconds)}</TableCell>
                        <TableCell>{call.agent || "-"}</TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground text-xs" title={call.transcriptionSnippet}>
                          {call.transcriptionSnippet || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Call Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewConversation(call)}>
                                <FileText className="mr-2 h-4 w-4" /> View Transcript
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewConversation(call)} disabled={!call.conversationId}>
                                <PlayCircle className="mr-2 h-4 w-4" /> Listen Recording
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleFlagMisuse(call)}>
                                <AlertTriangle className="mr-2 h-4 w-4" /> Flag Misuse
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )})
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Logs Feed</CardTitle>
            <CardDescription>Real-time system events and call activities.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] border rounded-md p-3">
              <div className="space-y-3">
                {logEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Info className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="font-medium">No activity logs</p>
                    <p className="text-sm">Activity logs will appear here when campaigns are running</p>
                  </div>
                ) : (
                  logEntries.map((log) => {
                    const LogIcon = logIcons[log.type];
                    return (
                    <div key={log.id} className="flex items-start text-xs">
                      <LogIcon className={cn("h-4 w-4 mr-2 mt-0.5 shrink-0", logColors[log.type])} />
                      <div className="flex-1">
                        <span className="font-medium">{log.message}</span>
                        <p className="text-muted-foreground text-xs">
                          {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Conversation Details Sheet */}
      <Sheet open={conversationSheetOpen} onOpenChange={setConversationSheetOpen}>
        <SheetContent className="sm:max-w-4xl w-full flex flex-col">
          <SheetHeader>
            <SheetTitle>Call Details</SheetTitle>
            <SheetDescription>
              {selectedConversation && (
                <>
                  Call to {selectedConversation.callerId} - {selectedConversation.campaignName}
                </>
              )}
            </SheetDescription>
          </SheetHeader>
          
          {conversationLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading conversation details...</p>
              </div>
            </div>
          ) : conversationDetails ? (
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="transcription" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="transcription">Transcription</TabsTrigger>
                  <TabsTrigger value="recording">Recording</TabsTrigger>
                </TabsList>
                
                <TabsContent value="transcription" className="flex-1 overflow-hidden">
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Transcription</h3>
                    </div>
                    
                    <ScrollArea className="flex-1 border rounded-md p-4">
                      <div className="space-y-4">
                        {conversationDetails.transcript ? (
                          <div className="space-y-3">
                            {conversationDetails.transcript.map((entry: any, index: number) => (
                              <div key={index} className="flex flex-col space-y-1">
                                <div className="flex items-center space-x-2">
                                  <Badge variant={entry.speaker === 'agent' ? 'default' : 'secondary'}>
                                    {entry.speaker === 'agent' ? 'AI Agent' : 'Customer'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {entry.timestamp ? new Date(entry.timestamp * 1000).toLocaleTimeString() : ''}
                                  </span>
                                </div>
                                <p className="text-sm bg-muted/50 p-3 rounded-md">
                                  {entry.text || entry.message || 'No text available'}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : conversationDetails.messages ? (
                          <div className="space-y-3">
                            {conversationDetails.messages.map((message: any, index: number) => (
                              <div key={index} className="flex flex-col space-y-1">
                                <div className="flex items-center space-x-2">
                                  <Badge variant={message.role === 'assistant' ? 'default' : 'secondary'}>
                                    {message.role === 'assistant' ? 'AI Agent' : 'Customer'}
                                  </Badge>
                                </div>
                                <p className="text-sm bg-muted/50 p-3 rounded-md">
                                  {message.content || message.text || 'No text available'}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground py-8">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No transcription available for this call</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>
                
                <TabsContent value="recording" className="flex-1 overflow-hidden">
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Recording</h3>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center">
                      {conversationAudioUrl ? (
                        <div className="w-full max-w-md">
                          <audio controls className="w-full">
                            <source src={conversationAudioUrl} type="audio/mpeg" />
                            <source src={conversationAudioUrl} type="audio/wav" />
                            Your browser does not support the audio element.
                          </audio>
                          <p className="text-sm text-muted-foreground text-center mt-2">
                            Click play to listen to the call recording
                          </p>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          <PlayCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No recording available for this call</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Failed to load conversation details</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Flag Misuse Dialog */}
      <Dialog open={flagMisuseOpen} onOpenChange={setFlagMisuseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Flag Call for Misuse
            </DialogTitle>
            <DialogDescription>
              Report inappropriate use of the calling system. This will flag the call for review by administrators.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedCallForFlag && (
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="text-sm font-medium">Call Details:</p>
                <p className="text-sm text-muted-foreground">
                  To: {selectedCallForFlag.callerId} | Campaign: {selectedCallForFlag.campaignName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Agent: {selectedCallForFlag.agent || 'Unknown'} | Duration: {formatDuration(selectedCallForFlag.durationSeconds)}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="flag-reason">Reason for Flagging *</Label>
              <Select value={flagReason} onValueChange={setFlagReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inappropriate-content">Inappropriate Content</SelectItem>
                  <SelectItem value="spam-calls">Spam/Unsolicited Calls</SelectItem>
                  <SelectItem value="harassment">Harassment or Abuse</SelectItem>
                  <SelectItem value="fraud">Fraudulent Activity</SelectItem>
                  <SelectItem value="privacy-violation">Privacy Violation</SelectItem>
                  <SelectItem value="system-abuse">System Abuse</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="flag-description">Description *</Label>
              <Textarea
                id="flag-description"
                placeholder="Please provide details about why this call should be flagged..."
                value={flagDescription}
                onChange={(e) => setFlagDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFlagMisuseOpen(false)}
              disabled={flagLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmitFlagMisuse}
              disabled={flagLoading || !flagReason || !flagDescription.trim()}
            >
              {flagLoading ? "Flagging..." : "Flag Call"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
