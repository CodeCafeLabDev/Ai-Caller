
"use client";

import * as React from "react";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { Metadata } from 'next';

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
  const [liveCalls, setLiveCalls] = React.useState<LiveCall[]>(initialLiveCalls);
  const [logEntries, setLogEntries] = React.useState<LogEntry[]>(initialLogEntries);
  
  const [totalLiveCalls, setTotalLiveCalls] = React.useState(0);
  const [activeAgents, setActiveAgents] = React.useState(0);
  const [avgResponseTime, setAvgResponseTime] = React.useState("0s");

  const formatDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  React.useEffect(() => {
    const interval = setInterval(() => {
      setLiveCalls(prevCalls =>
        prevCalls.map(call => {
          if (["Dialing", "Answered", "In Progress"].includes(call.status)) {
            const newDuration = call.durationSeconds + 1;
            let newStatus = call.status;
            if (Math.random() < 0.01 && call.status === "Dialing") newStatus = "Answered";
            else if (Math.random() < 0.005 && call.status === "Answered") newStatus = "In Progress";
            else if (Math.random() < 0.002 && call.status === "In Progress" && newDuration > 180) newStatus = "Completed";
            else if (Math.random() < 0.001 && call.status === "Dialing" && newDuration > 30) newStatus = "Failed";
            
            return { ...call, durationSeconds: newDuration, status: newStatus as CallStatus };
          }
          return call;
        })
      );

      if (Math.random() < 0.2) {
        const newLogId = `log_${Date.now()}`;
        const randomCall = liveCalls[Math.floor(Math.random() * liveCalls.length)];
        const logMessages = [
            `Call to ${randomCall?.callerId || 'unknown'} status updated to ${randomCall?.status || 'N/A'}.`,
            `New outbound call initiated for campaign '${randomCall?.campaignName || 'Unknown Campaign'}'.`,
            `AI Agent ${randomCall?.agent || 'N/A'} sentiment analysis: Positive.`,
            `Possible network issue detected for call to ${randomCall?.callerId || 'unknown'}.`
        ];
        const logTypes: LogType[] = ["info", "info", "info", "warning"];
        const randomIndex = Math.floor(Math.random() * logMessages.length);

        setLogEntries(prevLogs => [{ id: newLogId, timestamp: new Date(), message: logMessages[randomIndex], type: logTypes[randomIndex] }, ...prevLogs.slice(0, 49) ]);
      }

      const currentLive = liveCalls.filter(c => ["Dialing", "Answered", "In Progress"].includes(c.status)).length;
      setTotalLiveCalls(currentLive);
      const agents = new Set(liveCalls.filter(c => c.agent && ["Answered", "In Progress"].includes(c.status)).map(c => c.agent));
      setActiveAgents(agents.size);
      setAvgResponseTime(`${Math.floor(Math.random() * 5) + 8}s`);


    }, 1000); 

    return () => clearInterval(interval);
  }, [liveCalls]); 

  const handleCallAction = (actionName: string, callId: string) => {
    toast({
      title: `Action: ${actionName}`,
      description: `Performed on call ${callId}. (Simulated)`,
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Monitor Live Calls</h1>
        <p className="text-muted-foreground">Real-time insights into your calling operations.</p>
      </div>

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
                  {liveCalls.map((call) => {
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
                            <DropdownMenuItem onClick={() => handleCallAction("View Full Transcript", call.id)}>
                              <FileText className="mr-2 h-4 w-4" /> View Transcript
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCallAction("Listen to Recording", call.id)} disabled={call.status !== "Completed"}>
                              <PlayCircle className="mr-2 h-4 w-4" /> Listen Recording
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleCallAction("Flag Misuse", call.id)}>
                              <AlertTriangle className="mr-2 h-4 w-4" /> Flag Misuse
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )})}
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
                {logEntries.map((log) => {
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
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
