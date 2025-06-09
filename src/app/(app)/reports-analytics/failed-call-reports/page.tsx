
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, subDays, addDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  PhoneOff,
  CalendarClock,
  Users,
  Megaphone,
  ListFilter,
  FileDown,
  FilterX,
  Check,
  ChevronsUpDown,
  Eye,
  RefreshCw,
  MoreHorizontal,
  ShieldAlert,
  AlertCircle
} from "lucide-react";

type CallFailureReason = "No Answer" | "Busy" | "Network Error" | "Invalid Number" | "Agent Unavailable" | "Other";
type ResolvedStatus = "Yes" | "No" | "Investigating";

interface FailedCallEntry {
  id: string;
  callId: string;
  clientName: string;
  clientId: string;
  campaignName: string;
  campaignId: string;
  timestamp: Date;
  phoneNumber: string; // Masked
  failureReason: CallFailureReason;
  attemptCount: number;
  isResolved: ResolvedStatus;
  notes?: string;
}

interface FilterOption {
  value: string;
  label: string;
}

const mockClients: FilterOption[] = [
  { value: "all", label: "All Clients" },
  { value: "client_1", label: "Innovate Corp" },
  { value: "client_2", label: "Solutions Ltd" },
  { value: "client_3", label: "Tech Ventures" },
];

const mockCampaigns: FilterOption[] = [
  { value: "all", label: "All Campaigns" },
  { value: "camp_1", label: "Q4 Lead Generation" },
  { value: "camp_2", label: "New Product Launch" },
  { value: "camp_3", label: "Feedback Drive" },
];

const failureReasonOptions: CallFailureReason[] = ["No Answer", "Busy", "Network Error", "Invalid Number", "Agent Unavailable", "Other"];
const resolvedStatusOptions: ResolvedStatus[] = ["Yes", "No", "Investigating"];

const initialMockFailedCalls: FailedCallEntry[] = [
  { id: "fc_1", callId: "call_fail_001", clientName: "Innovate Corp", clientId: "client_1", campaignName: "Q4 Lead Generation", campaignId: "camp_1", timestamp: subDays(new Date(), 0.5), phoneNumber: "555-XXXX-11", failureReason: "No Answer", attemptCount: 3, isResolved: "No" },
  { id: "fc_2", callId: "call_fail_002", clientName: "Solutions Ltd", clientId: "client_2", campaignName: "New Product Launch", campaignId: "camp_2", timestamp: subDays(new Date(), 1.2), phoneNumber: "555-XXXX-22", failureReason: "Busy", attemptCount: 2, isResolved: "Investigating", notes: "Client reports line often busy during peak hours." },
  { id: "fc_3", callId: "call_fail_003", clientName: "Tech Ventures", clientId: "client_3", campaignName: "Feedback Drive", campaignId: "camp_3", timestamp: subDays(new Date(), 2), phoneNumber: "555-XXXX-33", failureReason: "Network Error", attemptCount: 1, isResolved: "Yes" },
  { id: "fc_4", callId: "call_fail_004", clientName: "Innovate Corp", clientId: "client_1", campaignName: "Q4 Lead Generation", campaignId: "camp_1", timestamp: subDays(new Date(), 0.8), phoneNumber: "555-XXXX-44", failureReason: "Invalid Number", attemptCount: 1, isResolved: "Yes", notes: "Number marked as invalid in CRM." },
];

const failureReasonColors: Record<CallFailureReason, string> = {
  "No Answer": "bg-yellow-100 text-yellow-700",
  "Busy": "bg-orange-100 text-orange-700",
  "Network Error": "bg-red-100 text-red-700",
  "Invalid Number": "bg-pink-100 text-pink-700",
  "Agent Unavailable": "bg-purple-100 text-purple-700",
  "Other": "bg-gray-100 text-gray-700",
};
const resolvedStatusColors: Record<ResolvedStatus, string> = {
  Yes: "bg-green-100 text-green-700",
  No: "bg-red-100 text-red-700",
  Investigating: "bg-yellow-100 text-yellow-700",
};


export default function FailedCallReportsPage() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({ from: subDays(new Date(), 7), to: new Date() });
  const [selectedClientId, setSelectedClientId] = React.useState<string>("all");
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string>("all");
  const [selectedFailureReason, setSelectedFailureReason] = React.useState<CallFailureReason | "all">("all");
  
  const [failedCalls, setFailedCalls] = React.useState<FailedCallEntry[]>(initialMockFailedCalls);

  const [clientOpen, setClientOpen] = React.useState(false);
  const [campaignOpen, setCampaignOpen] = React.useState(false);
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const filteredFailedCalls = React.useMemo(() => {
    return failedCalls.filter(log => {
      const dateMatch = dateRange?.from && dateRange?.to ? 
        log.timestamp >= dateRange.from && log.timestamp <= addDays(dateRange.to, 1) : true;
      const clientMatch = selectedClientId === "all" || log.clientId === selectedClientId;
      const campaignMatch = selectedCampaignId === "all" || log.campaignId === selectedCampaignId;
      const failureReasonMatch = selectedFailureReason === "all" || log.failureReason === selectedFailureReason;
      return dateMatch && clientMatch && campaignMatch && failureReasonMatch;
    }).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [failedCalls, dateRange, selectedClientId, selectedCampaignId, selectedFailureReason]);

  const totalPages = Math.ceil(filteredFailedCalls.length / itemsPerPage);
  const paginatedFailedCalls = filteredFailedCalls.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleApplyFilters = () => {
    setCurrentPage(1);
    toast({ title: "Filters Applied", description: "Failed call log data has been updated." });
  };

  const handleResetFilters = () => {
    setDateRange({ from: subDays(new Date(), 7), to: new Date() });
    setSelectedClientId("all");
    setSelectedCampaignId("all");
    setSelectedFailureReason("all");
    setCurrentPage(1);
    toast({ title: "Filters Reset", description: "Failed call log filters have been reset." });
  };

  const handleExport = (format: "CSV" | "Excel" | "PDF") => {
    toast({ 
        title: "Export Initiated (Simulated)", 
        description: `Preparing failed call logs report as ${format}.`,
    });
    console.log(`Simulating export of failed call logs as ${format}. Data:`, filteredFailedCalls);
  };
  
  const handleMarkResolved = (logId: string) => {
    setFailedCalls(prev => prev.map(log => log.id === logId ? {...log, isResolved: log.isResolved === "Yes" ? "No" : "Yes"} : log));
    toast({ title: "Status Updated", description: `Failed call log ${logId} resolution status toggled.`});
  };

  const handleRetryCall = (logId: string, callId: string) => {
    // Simulate retry logic
    toast({ title: "Retry Initiated", description: `Retrying call ${callId} for log ${logId}. (Simulated)`});
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <PhoneOff className="mr-3 h-8 w-8 text-destructive" /> Failed Call Reports
          </h1>
          <p className="text-muted-foreground">
            Investigate failed calls and identify patterns or issues.
          </p>
        </div>
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" /> Export Report
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export Options</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleExport("CSV")}>Export as CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("Excel")}>Export as Excel</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("PDF")}>Export as PDF</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ListFilter className="mr-2 h-5 w-5"/>Filter Failed Call Logs</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">Date Range</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date-failed-calls" variant={"outline"} className={cn("w-full justify-start text-left font-normal h-9", !dateRange && "text-muted-foreground")}>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</> : format(dateRange.from, "LLL dd, y")) : <span>Pick a date range</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">Client</span>
             <Popover open={clientOpen} onOpenChange={setClientOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between h-9">
                  <Users className="mr-2 h-4 w-4 opacity-50 shrink-0" />
                  {mockClients.find(client => client.value === selectedClientId)?.label || "Select Client"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command>
                  <CommandInput placeholder="Search client..." /><CommandList><CommandEmpty>No client found.</CommandEmpty><CommandGroup>
                  {mockClients.map(client => (<CommandItem key={client.value} value={client.label} onSelect={() => {setSelectedClientId(client.value); setClientOpen(false);}}><Check className={cn("mr-2 h-4 w-4", selectedClientId === client.value ? "opacity-100" : "opacity-0")}/>{client.label}</CommandItem>))}
              </CommandGroup></CommandList></Command></PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">Campaign</span>
            <Popover open={campaignOpen} onOpenChange={setCampaignOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between h-9">
                    <Megaphone className="mr-2 h-4 w-4 opacity-50 shrink-0" />
                    {mockCampaigns.find(campaign => campaign.value === selectedCampaignId)?.label || "Select Campaign"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command>
                  <CommandInput placeholder="Search campaign..." /><CommandList><CommandEmpty>No campaign.</CommandEmpty><CommandGroup>
                  {mockCampaigns.map(campaign => (<CommandItem key={campaign.value} value={campaign.label} onSelect={() => {setSelectedCampaignId(campaign.value);setCampaignOpen(false);}}><Check className={cn("mr-2 h-4 w-4", selectedCampaignId === campaign.value ? "opacity-100":"opacity-0")}/>{campaign.label}</CommandItem>))}
              </CommandGroup></CommandList></Command></PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">Failure Reason</span>
            <Select value={selectedFailureReason} onValueChange={(value) => setSelectedFailureReason(value as CallFailureReason | "all")}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Reasons</SelectItem>
                    {failureReasonOptions.map(reason => <SelectItem key={reason} value={reason}>{reason}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleApplyFilters} className="w-full h-9">Apply</Button>
            <Button onClick={handleResetFilters} variant="outline" className="w-full h-9"><FilterX className="mr-2 h-4 w-4"/> Reset</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Failed Call Log Details</CardTitle>
          <CardDescription>List of failed calls based on current filters.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Call ID</TableHead>
                  <TableHead>Client / Campaign</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Failure Reason</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Resolved</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFailedCalls.length > 0 ? paginatedFailedCalls.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">{format(log.timestamp, "MMM dd, HH:mm:ss")}</TableCell>
                    <TableCell className="font-mono text-xs">{log.callId}</TableCell>
                    <TableCell>
                        <div>{log.clientName}</div>
                        <div className="text-xs text-muted-foreground">{log.campaignName}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.phoneNumber}</TableCell>
                    <TableCell><Badge variant="outline" className={cn("text-xs", failureReasonColors[log.failureReason])}>{log.failureReason}</Badge></TableCell>
                    <TableCell className="text-center">{log.attemptCount}</TableCell>
                    <TableCell><Badge className={cn("text-xs", resolvedStatusColors[log.isResolved])}>{log.isResolved}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toast({title: "View Details", description: `Call ID: ${log.callId}`})}><Eye className="mr-2 h-4 w-4"/>View Full Details</DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onClick={() => handleMarkResolved(log.id)} disabled={log.isResolved === "Yes"}>
                                <Check className="mr-2 h-4 w-4 text-green-500"/>Mark Resolved
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRetryCall(log.id, log.callId)}>
                                <RefreshCw className="mr-2 h-4 w-4 text-blue-500"/>Retry Call
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No failed calls found for the selected criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
           <div className="text-xs text-muted-foreground">
             Showing <strong>{paginatedFailedCalls.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong>
             - <strong>{Math.min(currentPage * itemsPerPage, filteredFailedCalls.length)}</strong> of <strong>{filteredFailedCalls.length}</strong> logs
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

