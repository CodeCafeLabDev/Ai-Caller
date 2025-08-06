
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input"; 
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/cn";
import { format, subDays, addDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import Image from "next/image";
import {
  CalendarClock,
  Users,
  Megaphone,
  ListFilter,
  LineChart,
  PieChartIcon,
  BarChartBig,
  FileDown,
  FilterX,
  Check,
  ChevronsUpDown,
  Phone,
  TrendingUp,
  ClockIcon,
  Percent,
  LanguagesIcon,
  CheckCircle,
  Mail,
  FileText,
  SheetIcon,
  CalendarDays as CalendarIcon,
  MoreVertical,
} from "lucide-react";
import elevenLabsApi from "@/lib/elevenlabsApi";
import { api } from '@/lib/apiConfig';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose
} from '@/components/ui/sheet';
// Removed: import type { Metadata } from 'next';

// export const metadata: Metadata = {
//   title: 'Call Reports - AI Caller',
//   description: 'Analyze call performance, track trends, and gain insights into your calling operations with daily and monthly reports.',
//   keywords: ['call reports', 'call analytics', 'performance tracking', 'AI Caller reports'],
// };

type CallStatus = "Completed" | "Failed" | "Missed" | "Answered" | "All";
type ReportEntry = {
  id: string;
  date: Date;
  clientName: string;
  campaignName: string;
  totalCalls: number;
  connectedRate: number; 
  avgDurationMinutes: number;
  statusSummary: Record<"Completed" | "Failed" | "Missed" | "Answered", number>;
};

type FilterOption = {
  value: string;
  label: string;
};

type ExportFormat = "CSV" | "Excel" | "PDF";
type ReportPeriod = "Current View" | "Daily Summary" | "Weekly Summary" | "Monthly Summary";

const callStatuses: CallStatus[] = ["All", "Completed", "Failed", "Missed", "Answered"];

export default function CallReportsPage() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [clients, setClients] = React.useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = React.useState<string>("all");
  const [agents, setAgents] = React.useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = React.useState<string>("all");
  const [selectedStatus, setSelectedStatus] = React.useState<CallStatus>("All");
  const [clientOpen, setClientOpen] = React.useState(false);
  const [agentOpen, setAgentOpen] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [conversations, setConversations] = React.useState<any[]>([]);
  const [usageDetails, setUsageDetails] = React.useState<any>(null);
  const [conversationSheetOpen, setConversationSheetOpen] = React.useState(false);
  const [selectedConversation, setSelectedConversation] = React.useState<any>(null);
  const [conversationDetails, setConversationDetails] = React.useState<any>(null);
  const [conversationAudioUrl, setConversationAudioUrl] = React.useState<string | null>(null);
  const [conversationTab, setConversationTab] = React.useState('overview');
  const [conversationLoading, setConversationLoading] = React.useState(false);

  // Fetch clients on mount
  React.useEffect(() => {
    api.getClients()
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setClients(data.data);
        }
      });
  }, []);

  // Fetch agents for selected client
  React.useEffect(() => {
    async function fetchAgents() {
      setAgents([]);
      setSelectedAgentId("all");
      
      try {
        console.log("Fetching agents for client:", selectedClientId);
        
        // Get agent-client mappings from your local database
        const localAgentsRes = await fetch('/api/agents');
        const localAgentsData = await localAgentsRes.json();
        
        // Filter agents based on selection
        let clientAgents;
        if (selectedClientId === "all") {
          // Show all agents that are assigned to any client
          clientAgents = (localAgentsData.data || []).filter((agent: any) => 
            agent.client_id != null && agent.client_id !== undefined
          );
        } else {
          // Show only agents for the selected client
          clientAgents = (localAgentsData.data || []).filter((agent: any) => 
            String(agent.client_id) === String(selectedClientId)
          );
        }
        
        console.log("Local agents for client:", clientAgents);
        
        // Use local agent data directly since ElevenLabs API is returning 404s
        // This ensures agents show up even if ElevenLabs API fails
        const processedAgents = clientAgents.map((localAgent: any) => ({
          agent_id: localAgent.agent_id,
          agent_name: localAgent.name || localAgent.agent_name || `Agent ${localAgent.agent_id}`,
          client_id: localAgent.client_id,
          local_agent_id: localAgent.agent_id,
          // Add other local fields as needed
          description: localAgent.description,
          status: localAgent.status || 'active'
        }));
        
        console.log("Processed agents for client:", processedAgents);
        setAgents(processedAgents);
        
      } catch (error) {
        console.error("Error fetching agents:", error);
        setError("Failed to fetch agents");
      }
    }
    fetchAgents();
  }, [selectedClientId]);

  // Fetch agent data when agent is selected
  React.useEffect(() => {
    async function fetchAgentData() {
      if (selectedAgentId === "all" || !selectedAgentId) {
        setConversations([]);
        setUsageDetails(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("Fetching data for agent:", selectedAgentId);
        
        // Convert date range to Unix timestamps (in seconds, not milliseconds)
        const startUnix = Math.floor((dateRange?.from?.getTime() || Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
        const endUnix = Math.floor((dateRange?.to?.getTime() || Date.now()) / 1000);

        console.log("Date range:", { startUnix, endUnix, from: dateRange?.from, to: dateRange?.to });

        // Fetch conversations
        let conversationsData = [];
        try {
          const conversationsRes = await elevenLabsApi.listConversations({
            agent_id: selectedAgentId,
            call_start_after_unix: startUnix,
            call_start_before_unix: endUnix,
            page_size: 100,
            summary_mode: "include"
          });

          if (conversationsRes.ok) {
            const conversationsJson = await conversationsRes.json();
            conversationsData = conversationsJson.conversations || [];
            console.log("Conversations fetched:", conversationsData.length);
          } else {
            console.error("Failed to fetch conversations:", conversationsRes.status, conversationsRes.statusText);
            // Continue with empty conversations data
          }
        } catch (error) {
          console.error("Error fetching conversations:", error);
          // Continue with empty conversations data
        }

        // Fetch usage stats
        let usageData = null;
        try {
          const usageRes = await elevenLabsApi.getUsageStats({
            start_unix: startUnix,
            end_unix: endUnix
          });

          if (usageRes.ok) {
            usageData = await usageRes.json();
            console.log("Usage stats fetched:", usageData);
          } else {
            console.error("Failed to fetch usage stats:", usageRes.status, usageRes.statusText);
            // Continue with null usage data
          }
        } catch (error) {
          console.error("Error fetching usage stats:", error);
          // Continue with null usage data
        }

        setConversations(conversationsData);
        setUsageDetails(usageData);

      } catch (error) {
        console.error("Error in fetchAgentData:", error);
        setError("Failed to fetch agent data");
      } finally {
        setLoading(false);
      }
    }

    fetchAgentData();
  }, [selectedAgentId, dateRange]);

  // Filter conversations by status
  const filteredData = React.useMemo(() => {
    return conversations.filter((conv: any) => {
      const statusMatch = selectedStatus === "All" || conv.status === selectedStatus;
      return statusMatch;
    });
  }, [conversations, selectedStatus]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // KPIs (example: total calls, successful calls, avg duration, etc.)
  const kpiData = React.useMemo(() => {
    const totalCallsPlaced = filteredData.length;
    const successfulCalls = filteredData.filter((c: any) => c.call_successful === "success").length;
    const avgDuration = totalCallsPlaced > 0 ?
      (filteredData.reduce((sum: number, c: any) => sum + (c.call_duration_secs || 0), 0) / totalCallsPlaced) : 0;
    const pickupRate = totalCallsPlaced > 0 ?
      Math.round((filteredData.filter((c: any) => c.status === "Answered").length / totalCallsPlaced) * 100) : 0;
    return {
      totalCallsPlaced,
      successfulCalls,
      averageDuration: avgDuration ? `${(avgDuration / 60).toFixed(2)} min` : "0 min",
      pickupRate: `${pickupRate}%`,
      aiConversationSuccessRate: "-",
      callsByLanguage: {},
    };
  }, [filteredData]);

  const handleApplyFilters = () => {
    setCurrentPage(1); 
    toast({ title: "Filters Applied", description: "Report data has been updated based on your selections." });
  };

  const handleResetFilters = () => {
    setDateRange({ from: subDays(new Date(), 7), to: new Date() });
    setSelectedClientId("all");
    setSelectedAgentId("all");
    setSelectedStatus("All");
    setCurrentPage(1);
    toast({ title: "Filters Reset", description: "Report filters have been reset to default." });
  };

  const handleExport = (format: ExportFormat, period: ReportPeriod) => {
    toast({ 
        title: "Export Initiated (Simulated)", 
        description: `Preparing ${period} report as ${format}. This would include fields like Call ID, Client Name, Campaign, Phone (masked), Status, Duration, Timestamp, AI Agent.`,
        duration: 5000,
    });
    console.log(`Simulating export of ${period} as ${format}. Intended fields: Call ID, Client Name, Campaign Name, Phone Number (masked), Status, Duration, Timestamp, AI Agent Used. Current filtered (summarized) data:`, filteredData);
  };

  async function handleShowConversation(conversation: any) {
    setSelectedConversation(conversation);
    setConversationSheetOpen(true);
    setConversationDetails(null);
    setConversationAudioUrl(null);
    setConversationTab('overview');
    setConversationLoading(true);
    try {
      // Fetch conversation details
      const detailsRes = await elevenLabsApi.getConversationDetails(conversation.conversation_id);
      const details = await detailsRes.json();
      console.log('ElevenLabs Conversation Details API response:', details);
      setConversationDetails(details);
      // Fetch audio (get signed URL if needed)
      try {
        const audioRes = await elevenLabsApi.getConversationAudio(conversation.conversation_id);
        if (audioRes.ok) {
          const audioBlob = await audioRes.blob();
          setConversationAudioUrl(URL.createObjectURL(audioBlob));
        } else {
          setConversationAudioUrl(null);
        }
      } catch {
        setConversationAudioUrl(null);
      }
    } catch (err) {
      console.error('Error fetching conversation details:', err);
      setConversationDetails(null);
    } finally {
      setConversationLoading(false);
    }
  }

  async function handleDeleteConversation() {
    if (!selectedConversation) return;
    await elevenLabsApi.deleteConversation(selectedConversation.conversation_id);
    setConversationSheetOpen(false);
    // Optionally refresh data
  }

  // Compute clientOptions from clients state
  const clientOptions = React.useMemo(() => [
    { value: 'all', label: 'All Clients' },
    ...clients.map((c: any) => ({ value: String(c.id), label: c.companyName }))
  ], [clients]);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <CalendarClock className="mr-3 h-8 w-8 text-primary" /> Daily/Monthly Call Reports
          </h1>
          <p className="text-muted-foreground">
            Analyze call performance, track trends, and gain insights into your operations.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <FileDown className="mr-2 h-4 w-4" /> Export Options
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Export Current View As</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleExport("CSV", "Current View")}>
              <FileText className="mr-2 h-4 w-4" /> CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("Excel", "Current View")}>
              <SheetIcon className="mr-2 h-4 w-4" /> Excel (XLSX)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("PDF", "Current View")}>
              <FileText className="mr-2 h-4 w-4" /> PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Export Summaries As</DropdownMenuLabel>
             <DropdownMenuItem onClick={() => handleExport("CSV", "Daily Summary")}>
                Daily Summary (CSV)
            </DropdownMenuItem>
             <DropdownMenuItem onClick={() => handleExport("CSV", "Weekly Summary")}>
                Weekly Summary (CSV)
            </DropdownMenuItem>
             <DropdownMenuItem onClick={() => handleExport("CSV", "Monthly Summary")}>
                Monthly Summary (CSV)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Scheduled & Email</DropdownMenuLabel>
            <DropdownMenuItem disabled>
              <CalendarIcon className="mr-2 h-4 w-4" /> Schedule Daily Export
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Mail className="mr-2 h-4 w-4" /> Email Export
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ListFilter className="mr-2 h-5 w-5"/>Filter Report Data</CardTitle>
          <CardDescription>Refine the report by date, client, campaign, or call status.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">Date Range</span>
             <Popover>
                <PopoverTrigger asChild>
                    <Button
                    id="date"
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal h-9", !dateRange && "text-muted-foreground")}
                    >
                    <CalendarClock className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                        dateRange.to ? (
                        <>
                            {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                        ) : (
                        format(dateRange.from, "LLL dd, y")
                        )
                    ) : (
                        <span>Pick a date</span>
                    )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    />
                     <div className="p-2 border-t flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setDateRange({from: new Date(), to: new Date()})}>Today</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDateRange({from: subDays(new Date(), 6), to: new Date()})}>Last 7 Days</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDateRange({from: subDays(new Date(), 29), to: new Date()})}>Last 30 Days</Button>
                    </div>
                </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">Client</span>
            <Popover open={clientOpen} onOpenChange={setClientOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={clientOpen} className="w-full justify-between h-9">
                  <Users className="mr-2 h-4 w-4 opacity-50 shrink-0" />
                  {clientOptions.find(client => client.value === selectedClientId)?.label || "Select Client"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search client..." />
                  <CommandList><CommandEmpty>No client found.</CommandEmpty>
                  <CommandGroup>
                    {clientOptions.map(client => (
                      <CommandItem key={client.value} value={client.label} onSelect={() => { setSelectedClientId(client.value); setClientOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", selectedClientId === client.value ? "opacity-100" : "opacity-0")} />
                        {client.label}
                      </CommandItem>
                    ))}
                  </CommandGroup></CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
           <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">Campaign</span>
            <Popover open={agentOpen} onOpenChange={setAgentOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={agentOpen} className="w-full justify-between h-9">
                  <Users className="mr-2 h-4 w-4 opacity-50 shrink-0" />
                  {agents.find(agent => agent.agent_id === selectedAgentId)?.agent_name || "Select Agent"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search agent..." />
                  <CommandList><CommandEmpty>No agent found.</CommandEmpty>
                  <CommandGroup>
                    {agents.map(agent => (
                      <CommandItem key={agent.agent_id} value={agent.agent_name} onSelect={() => { setSelectedAgentId(agent.agent_id); setAgentOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", selectedAgentId === agent.agent_id ? "opacity-100" : "opacity-0")} />
                        {agent.agent_name}
                      </CommandItem>
                    ))}
                  </CommandGroup></CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">Call Status</span>
             <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as CallStatus)}>
                <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                    {callStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleApplyFilters} className="w-full h-9">Apply</Button>
            <Button onClick={handleResetFilters} variant="outline" className="w-full h-9">
                <FilterX className="mr-2 h-4 w-4"/> Reset
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Key Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="p-4 border rounded-lg"><div className="flex items-center text-sm text-muted-foreground"><Phone className="mr-2 h-4 w-4"/>Total Calls</div><div className="text-2xl font-bold">{kpiData.totalCallsPlaced.toLocaleString()}</div></div>
            <div className="p-4 border rounded-lg"><div className="flex items-center text-sm text-muted-foreground"><CheckCircle className="mr-2 h-4 w-4"/>Successful Calls</div><div className="text-2xl font-bold">{kpiData.successfulCalls.toLocaleString()}</div></div>
            <div className="p-4 border rounded-lg"><div className="flex items-center text-sm text-muted-foreground"><ClockIcon className="mr-2 h-4 w-4"/>Avg. Duration</div><div className="text-2xl font-bold">{kpiData.averageDuration}</div></div>
            <div className="p-4 border rounded-lg"><div className="flex items-center text-sm text-muted-foreground"><TrendingUp className="mr-2 h-4 w-4"/>Pickup Rate</div><div className="text-2xl font-bold">{kpiData.pickupRate}</div></div>
            <div className="p-4 border rounded-lg"><div className="flex items-center text-sm text-muted-foreground"><Percent className="mr-2 h-4 w-4"/>AI Success Rate</div><div className="text-2xl font-bold">{kpiData.aiConversationSuccessRate}</div></div>
            <div className="p-4 border rounded-lg"><div className="flex items-center text-sm text-muted-foreground"><LanguagesIcon className="mr-2 h-4 w-4"/>Calls by Language</div><div className="text-xs">{Object.entries(kpiData.callsByLanguage).map(([lang, count]) => `${lang}: ${count}`).join(', ')}</div></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Call Report Data</CardTitle>
          <CardDescription>View individual report entries based on applied filters.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Evaluation result</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? paginatedData.map((entry, index) => {
                  const agent = agents.find((a: any) => a.agent_id === entry.agent_id);
                  const clientName = agent?.client_name || clients.find((c: any) => String(c.id) === String(agent?.client_id))?.companyName || "N/A";
                  return (
                    <TableRow key={entry.conversation_id || entry.agent_id || `entry-${index}`}>
                      <TableCell>{entry.start_time_unix_secs ? format(new Date(entry.start_time_unix_secs * 1000), "MMM dd, yyyy, hh:mm a") : "N/A"}</TableCell>
                      <TableCell>{entry.agent_name || agent?.agent_name || "N/A"}</TableCell>
                      <TableCell>{clientName}</TableCell>
                      <TableCell>{entry.call_duration_secs ? `${Math.floor(entry.call_duration_secs / 60)}:${(entry.call_duration_secs % 60).toString().padStart(2, '0')}` : "0:00"}</TableCell>
                      <TableCell>{entry.message_count ?? (entry.messages ? entry.messages.length : 0)}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{entry.evaluation_result || "Unknown"}</Badge></TableCell>
                    <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><span className="sr-only">Actions</span><ChevronsUpDown className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleShowConversation(entry)}>
                              Show Conversation
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {loading ? "Loading data..." : error ? error : "No data available for the selected filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
         <CardFooter className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
           <div className="text-xs text-muted-foreground">
             Showing <strong>{paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong>
             -<strong>{Math.min(currentPage * itemsPerPage, filteredData.length)}</strong> of <strong>{filteredData.length}</strong> entries
           </div>
           <div className="flex gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
            >
                Previous
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
            >
                Next
            </Button>
           </div>
        </CardFooter>
      </Card>
      
      {/* ElevenLabs Raw Data Section */}
      <Card>
        <CardHeader>
          <CardTitle>ElevenLabs Raw Data</CardTitle>
          <CardDescription>Complete data fetched from ElevenLabs Usage API and Conversations API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usage Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Usage Details (ElevenLabs Usage API)</h3>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-auto whitespace-pre-wrap">
                {usageDetails ? JSON.stringify(usageDetails, null, 2) : "No usage data available"}
              </pre>
            </div>
          </div>
          
          {/* Conversations Data */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Conversations Data (ElevenLabs Conversations API)</h3>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-auto whitespace-pre-wrap">
                {conversations.length > 0 ? JSON.stringify(conversations, null, 2) : "No conversations data available"}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
      <Sheet open={conversationSheetOpen} onOpenChange={setConversationSheetOpen}>
        <SheetContent
          side="right"
          className="!w-[1000px] !max-w-none !min-w-[1000px] px-0"
          style={{ width: '1000px', maxWidth: '1000px', minWidth: '1000px' }}
        >
          <SheetHeader>
            <SheetTitle>
              Conversation with {selectedConversation?.agent_name || 'Agent'}
            </SheetTitle>
            <SheetDescription>
              {selectedConversation?.conversation_id}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col md:flex-row gap-6 mt-4">
            <div className="flex-1 min-w-0">
              <Tabs value={conversationTab} onValueChange={setConversationTab} className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="transcription">Transcription</TabsTrigger>
                  <TabsTrigger value="clientdata">Client data</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  {conversationLoading ? 'Loading...' : (
                    <div className="space-y-6">
                      {/* Summary */}
                      <div>
                        <div className="font-semibold text-base mb-2">Summary</div>
                        <div className="text-sm text-gray-700 leading-relaxed">{conversationDetails?.transcript_summary || selectedConversation?.transcript_summary || 'N/A'}</div>
                      </div>
                      {/* Call status */}
                      <div>
                        <div className="font-semibold text-base mb-2">Call status</div>
                        <div className="text-sm text-gray-700">{conversationDetails?.analysis?.call_successful || 'Unknown'}</div>
                      </div>
                      {/* User ID */}
                      <div>
                        <div className="font-semibold text-base mb-2">User ID</div>
                        <div className="text-sm text-gray-700 font-mono">{conversationDetails?.user_id || 'Unknown'}</div>
                      </div>
                      {/* Criteria evaluation */}
                      {conversationDetails?.analysis?.evaluation_criteria_results && (
                        <div>
                          <div className="font-semibold text-base mb-2">Criteria evaluation</div>
                          <div className="text-sm text-gray-600 mb-3">0 of {Object.keys(conversationDetails.analysis.evaluation_criteria_results).length} successful</div>
                          {Object.entries(conversationDetails.analysis.evaluation_criteria_results).map(([key, val]: [string, any]) => (
                            <div key={key} className="mb-4">
                              <div className="font-semibold text-sm text-gray-800 mb-1">{key.replace(/_/g, ' ')}</div>
                              <div className="text-sm text-gray-700 mb-1">{val.value ?? 'unknown'}</div>
                              {val.rationale && <div className="text-xs text-gray-500 leading-relaxed">{val.rationale}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Data collection */}
                      {conversationDetails?.analysis?.data_collection_results && (
                        <div>
                          <div className="font-semibold text-base mb-2">Data collection</div>
                          {Object.entries(conversationDetails.analysis.data_collection_results).map(([key, val]: [string, any]) => (
                            <div key={key} className="mb-4">
                              <div className="font-semibold text-sm text-gray-800 mb-1">{key}</div>
                              <div className="text-sm text-gray-700 mb-1">Type: {val.json_schema?.type || 'unknown'}</div>
                              <div className="text-sm text-gray-700 mb-1">Value: {val.value === null ? 'null' : String(val.value)}</div>
                              {val.rationale && <div className="text-xs text-gray-500 leading-relaxed">{val.rationale}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Call summary title */}
                      {conversationDetails?.analysis?.call_summary_title && (
                        <div>
                          <div className="font-semibold text-base mb-2">Call summary title</div>
                          <div className="text-sm text-gray-700">{conversationDetails.analysis.call_summary_title}</div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="transcription">
                  {conversationLoading ? 'Loading...' : (
                    <div className="space-y-2">
                      {(conversationDetails?.transcript || []).map((msg: any, i: number) => (
                        <div key={i} className="text-sm">
                          <span className="font-semibold">{msg.role || 'Speaker'}:</span> {msg.message || ''} <span className="text-xs text-muted-foreground">{msg.timestamp ? `(${msg.timestamp})` : ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="clientdata">
                  {conversationLoading ? 'Loading...' : (
                    <div className="space-y-2">
                      {conversationDetails?.conversation_initiation_client_data ? (
                        Object.entries(conversationDetails.conversation_initiation_client_data).map(([key, value]: [string, any]) => (
                          <div key={key} className="text-sm">
                            <span className="font-semibold">{key}:</span> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </div>
                        ))
                      ) : 'No client data'}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              {/* Audio player */}
              {conversationAudioUrl && (
                <audio controls src={conversationAudioUrl} className="w-full mt-4" />
              )}
            </div>
            {/* Metadata sidebar */}
            <div className="w-full md:w-64 flex-shrink-0 border-l pl-4">
              <div className="mb-4 text-sm font-semibold text-gray-800">Metadata</div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Date</div>
                  <div className="text-sm text-gray-700">{conversationDetails?.metadata?.accepted_time_unix_secs ? format(new Date(conversationDetails.metadata.accepted_time_unix_secs * 1000), 'MMM dd, yyyy, hh:mm a') : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Connection duration</div>
                  <div className="text-sm text-gray-700">{conversationDetails?.metadata?.call_duration_secs ? `${Math.floor(conversationDetails.metadata.call_duration_secs / 60)}:${(conversationDetails.metadata.call_duration_secs % 60).toString().padStart(2, '0')}` : '0:00'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Credits (call)</div>
                  <div className="text-sm text-gray-700">{conversationDetails?.metadata?.cost || 'N/A'}</div>
                  {conversationDetails?.metadata?.charging?.dev_discount && (
                    <div className="text-xs text-gray-500">Development discount applied</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Credits (LLM)</div>
                  <div className="text-sm text-gray-700">{conversationDetails?.metadata?.charging?.llm_usage?.total_tokens || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">LLM Cost</div>
                  <div className="text-sm text-gray-700">${conversationDetails?.metadata?.charging?.llm_price || '0.0000'} / min</div>
                  <div className="text-sm text-gray-700">Total: ${conversationDetails?.metadata?.charging?.llm_cost || '0.0000'}</div>
                </div>
              </div>
              {/* Actions */}
              <div className="mt-6 space-y-2">
                <Button variant="destructive" size="sm" onClick={handleDeleteConversation} className="w-full">Delete Conversation</Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
