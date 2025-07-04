
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
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/cn";
import { format, subDays, addDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  PhoneCall,
  CalendarDays,
  ListFilter,
  FilterX,
  Download,
  Eye,
  PlayCircle,
  MoreHorizontal,
  ChevronsUpDown,
  Check,
  Megaphone,
  ClipboardList,
} from "lucide-react";

type CallStatus = "Answered" | "Voicemail" | "Failed - No Answer" | "Failed - Busy" | "Completed" | "All";

type CallHistoryEntry = {
  id: string;
  timestamp: Date;
  campaignName: string;
  phoneNumber: string; // Masked
  duration: string; // e.g., "2m 15s"
  status: Exclude<CallStatus, "All">;
  agent?: string; // AI or Human
  recordingUrl?: string; // Mock
  transcriptSnippet?: string;
};

const mockCampaignsForFilter: { value: string; label: string }[] = [
  { value: "all", label: "All Campaigns" },
  { value: "camp_c1_01", label: "Q4 Lead Generation" },
  { value: "camp_c1_02", label: "Customer Feedback July" },
  { value: "camp_c1_03", label: "New Product Teaser" },
];

const callStatuses: CallStatus[] = ["All", "Answered", "Voicemail", "Failed - No Answer", "Failed - Busy", "Completed"];

const initialMockCallHistory: CallHistoryEntry[] = [
  { id: "call_h1", timestamp: subDays(new Date(), 1), campaignName: "Q4 Lead Generation", phoneNumber: "555-XXXX-01", duration: "3m 45s", status: "Completed", agent: "AI-Agent-01", transcriptSnippet: "User expressed interest in the premium package." },
  { id: "call_h2", timestamp: subDays(new Date(), 2), campaignName: "Customer Feedback July", phoneNumber: "555-XXXX-02", duration: "1m 30s", status: "Voicemail", agent: "AI-Agent-02" },
  { id: "call_h3", timestamp: subDays(new Date(), 0.5), campaignName: "Q4 Lead Generation", phoneNumber: "555-XXXX-03", duration: "0m 15s", status: "Failed - No Answer", agent: "AI-Agent-01" },
  { id: "call_h4", timestamp: subDays(new Date(), 3), campaignName: "New Product Teaser", phoneNumber: "555-XXXX-04", duration: "2m 05s", status: "Answered", agent: "AI-Agent-03", transcriptSnippet: "Scheduled a follow-up call for next week." },
  { id: "call_h5", timestamp: subDays(new Date(), 4), campaignName: "Customer Feedback July", phoneNumber: "555-XXXX-05", duration: "5m 10s", status: "Completed", agent: "AI-Agent-02", transcriptSnippet: "Gathered detailed feedback on new UI." },
  { id: "call_h6", timestamp: subDays(new Date(), 0.2), campaignName: "Q4 Lead Generation", phoneNumber: "555-XXXX-06", duration: "0m 25s", status: "Failed - Busy", agent: "AI-Agent-01" },
];

const statusVariants: Record<Exclude<CallStatus, "All">, string> = {
  Answered: "bg-sky-100 text-sky-700",
  Voicemail: "bg-orange-100 text-orange-700",
  "Failed - No Answer": "bg-red-100 text-red-700",
  "Failed - Busy": "bg-pink-100 text-pink-700",
  Completed: "bg-green-100 text-green-700",
};


export default function ClientCallHistoryPage() {
  const { toast } = useToast();
  const [callHistory, setCallHistory] = React.useState<CallHistoryEntry[]>(initialMockCallHistory);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({ from: subDays(new Date(), 7), to: new Date() });
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string>("all");
  const [selectedStatus, setSelectedStatus] = React.useState<CallStatus>("All");
  const [searchTerm, setSearchTerm] = React.useState("");

  const [campaignOpen, setCampaignOpen] = React.useState(false);
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const filteredCallHistory = React.useMemo(() => {
    return callHistory.filter(call => {
      const dateMatch = dateRange?.from && dateRange?.to ? 
        call.timestamp >= dateRange.from && call.timestamp <= addDays(dateRange.to, 1) : true;
      const campaignMatch = selectedCampaignId === "all" || mockCampaignsForFilter.find(c => c.label === call.campaignName)?.value === selectedCampaignId;
      const statusMatch = selectedStatus === "All" || call.status === selectedStatus;
      const searchMatch = searchTerm === "" ||
        call.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (call.agent && call.agent.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (call.transcriptSnippet && call.transcriptSnippet.toLowerCase().includes(searchTerm.toLowerCase()));
      return dateMatch && campaignMatch && statusMatch && searchMatch;
    }).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [callHistory, dateRange, selectedCampaignId, selectedStatus, searchTerm]);

  const totalPages = Math.ceil(filteredCallHistory.length / itemsPerPage);
  const paginatedCallHistory = filteredCallHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleApplyFilters = () => {
    setCurrentPage(1);
    toast({ title: "Filters Applied", description: "Call history has been updated." });
  };

  const handleResetFilters = () => {
    setDateRange({ from: subDays(new Date(), 7), to: new Date() });
    setSelectedCampaignId("all");
    setSelectedStatus("All");
    setSearchTerm("");
    setCurrentPage(1);
    toast({ title: "Filters Reset", description: "Call history filters have been reset." });
  };

  const handleDownloadLogs = (format: "CSV" | "JSON") => {
    toast({ title: `Download Call History (${format})`, description: "Download initiated (Simulated)." });
    console.log(`Simulating download of call history as ${format}:`, filteredCallHistory);
  };
  
  const handleCallAction = (action: string, callId: string) => {
    toast({ title: `Action: ${action}`, description: `Performed on Call ID ${callId} (Simulated)`});
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <ClipboardList className="mr-3 h-8 w-8 text-primary" /> Campaign Call History
          </h1>
          <p className="text-muted-foreground">
            Review past call records for your campaigns.
          </p>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline"><Download className="mr-2 h-4 w-4"/>Download History</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleDownloadLogs("CSV")}>Download as CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadLogs("JSON")}>Download as JSON</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ListFilter className="mr-2 h-5 w-5"/>Filter Call History</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
            <div className="flex flex-col space-y-1.5">
                <span className="text-sm font-medium">Date Range</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="date-call-history" variant={"outline"} className={cn("w-full justify-start text-left font-normal h-9", !dateRange && "text-muted-foreground")}>
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</> : format(dateRange.from, "LLL dd, y")) : <span>Pick a date range</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                  </PopoverContent>
                </Popover>
            </div>
            <div className="flex flex-col space-y-1.5">
                <span className="text-sm font-medium">Campaign</span>
                 <Popover open={campaignOpen} onOpenChange={setCampaignOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between h-9">
                        <Megaphone className="mr-2 h-4 w-4 opacity-50 shrink-0" />
                        {mockCampaignsForFilter.find(c => c.value === selectedCampaignId)?.label || "Select Campaign"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command>
                        <CommandInput placeholder="Search campaign..." />
                        <CommandList><CommandEmpty>No campaign.</CommandEmpty><CommandGroup>
                        {mockCampaignsForFilter.map(c => (<CommandItem key={c.value} value={c.label} onSelect={() => {setSelectedCampaignId(c.value); setCampaignOpen(false);}}><Check className={cn("mr-2 h-4 w-4", selectedCampaignId === c.value ? "opacity-100" : "opacity-0")}/>{c.label}</CommandItem>))}
                    </CommandGroup></CommandList></Command></PopoverContent>
                </Popover>
            </div>
            <div className="flex flex-col space-y-1.5">
                <span className="text-sm font-medium">Call Status</span>
                 <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as CallStatus)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {callStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-col space-y-1.5">
                <span className="text-sm font-medium">Search Phone/Agent/Transcript</span>
                <Input placeholder="Keyword..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-9"/>
            </div>
            <div className="flex gap-2 col-span-full md:col-span-1 xl:col-span-1 self-end">
                <Button onClick={handleApplyFilters} className="w-full h-9">Apply Filters</Button>
                <Button onClick={handleResetFilters} variant="outline" className="w-full h-9"><FilterX className="mr-2 h-4 w-4"/> Reset</Button>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Call Log</CardTitle>
          <CardDescription>Detailed list of calls based on your filters.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[600px] border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead className="min-w-[200px]">Transcript Snippet</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCallHistory.length > 0 ? paginatedCallHistory.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell className="text-xs">{format(call.timestamp, "MMM dd, HH:mm:ss")}</TableCell>
                    <TableCell>{call.campaignName}</TableCell>
                    <TableCell className="font-mono text-xs">{call.phoneNumber}</TableCell>
                    <TableCell>{call.duration}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", statusVariants[call.status])}>
                        {call.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{call.agent || "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={call.transcriptSnippet}>
                        {call.transcriptSnippet || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleCallAction("View Details", call.id)}><Eye className="mr-2 h-4 w-4"/>View Full Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCallAction("Listen Recording", call.id)} disabled={!call.recordingUrl}><PlayCircle className="mr-2 h-4 w-4"/>Listen Recording</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No call history found for selected filters.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
           <div className="text-xs text-muted-foreground">
             Showing <strong>{paginatedCallHistory.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong>
             - <strong>{Math.min(currentPage * itemsPerPage, filteredCallHistory.length)}</strong> of <strong>{filteredCallHistory.length}</strong> calls
           </div>
           <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
           </div>
        </CardFooter>
      </Card>
    </div>
  );
}
