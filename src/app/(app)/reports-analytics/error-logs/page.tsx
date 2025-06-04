
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
  AlertTriangle,
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
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  CalendarDays,
  ShieldAlert,
  MoreHorizontal
} from "lucide-react";
import type { Metadata } from 'next';

// export const metadata: Metadata = {
//   title: 'Error & Failed Call Logs - Voxaiomni',
//   description: 'Investigate system errors, failed calls, and manage resolutions. Filter logs by date, client, campaign, and error type.',
//   keywords: ['error logs', 'failed calls', 'call troubleshooting', 'system errors', 'voxaiomni logs'],
// };

type ErrorType = "Timeout" | "No Answer" | "Network Error" | "TTS Error" | "Bot Crash" | "Validation Error" | "API Limit Exceeded" | "Authentication Failed" | "Permission Denied";
type ResolvedStatus = "Yes" | "No" | "Investigating";
type RetryStatus = "Yes" | "No" | "In Progress";

interface ErrorLogEntry {
  id: string;
  callId: string;
  clientName: string;
  clientId: string;
  campaignName: string;
  campaignId: string;
  timestamp: Date;
  errorType: ErrorType;
  errorDescription: string;
  isResolved: ResolvedStatus;
  retryAttempted: RetryStatus;
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

const errorTypeOptions: ErrorType[] = ["Timeout", "No Answer", "Network Error", "TTS Error", "Bot Crash", "Validation Error", "API Limit Exceeded", "Authentication Failed", "Permission Denied"];

const initialMockErrorLogs: ErrorLogEntry[] = [
  { id: "err_1", callId: "call_abc_123", clientName: "Innovate Corp", clientId: "client_1", campaignName: "Q4 Lead Generation", campaignId: "camp_1", timestamp: subDays(new Date(), 1), errorType: "TTS Error", errorDescription: "Failed to synthesize speech: Invalid voice specified.", isResolved: "No", retryAttempted: "No" },
  { id: "err_2", callId: "call_def_456", clientName: "Solutions Ltd", clientId: "client_2", campaignName: "New Product Launch", campaignId: "camp_2", timestamp: subDays(new Date(), 2), errorType: "Network Error", errorDescription: "Connection timed out after 30 seconds.", isResolved: "Yes", retryAttempted: "Yes" },
  { id: "err_3", callId: "call_ghi_789", clientName: "Tech Ventures", clientId: "client_3", campaignName: "Feedback Drive", campaignId: "camp_3", timestamp: subDays(new Date(), 0), errorType: "Bot Crash", errorDescription: "Unhandled exception in script node 'gather_feedback'.", isResolved: "Investigating", retryAttempted: "No" },
  { id: "err_4", callId: "call_jkl_012", clientName: "Innovate Corp", clientId: "client_1", campaignName: "Q4 Lead Generation", campaignId: "camp_1", timestamp: subDays(new Date(), 3), errorType: "No Answer", errorDescription: "Call unanswered after 5 rings.", isResolved: "No", retryAttempted: "Yes" },
  { id: "err_5", callId: "call_mno_345", clientName: "Solutions Ltd", clientId: "client_2", campaignName: "Old Campaign", campaignId: "camp_old", timestamp: subDays(new Date(), 5), errorType: "API Limit Exceeded", errorDescription: "Rate limit hit for external weather API.", isResolved: "Yes", retryAttempted: "No" },
];

const resolvedStatusColors: Record<ResolvedStatus, string> = {
  Yes: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
  No: "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100",
  Investigating: "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100",
};
const retryStatusColors: Record<RetryStatus, string> = {
  Yes: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
  No: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100",
  "In Progress": "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100",
};


export default function ErrorLogsPage() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({ from: subDays(new Date(), 7), to: new Date() });
  const [selectedClientId, setSelectedClientId] = React.useState<string>("all");
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string>("all");
  const [selectedErrorType, setSelectedErrorType] = React.useState<ErrorType | "all">("all");
  
  const [errorLogs, setErrorLogs] = React.useState<ErrorLogEntry[]>(initialMockErrorLogs);

  const [clientOpen, setClientOpen] = React.useState(false);
  const [campaignOpen, setCampaignOpen] = React.useState(false);
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const filteredErrorLogs = React.useMemo(() => {
    return errorLogs.filter(log => {
      const dateMatch = dateRange?.from && dateRange?.to ? 
        log.timestamp >= dateRange.from && log.timestamp <= addDays(dateRange.to, 1) : true;
      const clientMatch = selectedClientId === "all" || log.clientId === selectedClientId;
      const campaignMatch = selectedCampaignId === "all" || log.campaignId === selectedCampaignId;
      const errorTypeMatch = selectedErrorType === "all" || log.errorType === selectedErrorType;
      return dateMatch && clientMatch && campaignMatch && errorTypeMatch;
    });
  }, [errorLogs, dateRange, selectedClientId, selectedCampaignId, selectedErrorType]);

  const totalPages = Math.ceil(filteredErrorLogs.length / itemsPerPage);
  const paginatedErrorLogs = filteredErrorLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleApplyFilters = () => {
    setCurrentPage(1);
    toast({ title: "Filters Applied", description: "Error log data has been updated." });
  };

  const handleResetFilters = () => {
    setDateRange({ from: subDays(new Date(), 7), to: new Date() });
    setSelectedClientId("all");
    setSelectedCampaignId("all");
    setSelectedErrorType("all");
    setCurrentPage(1);
    toast({ title: "Filters Reset", description: "Error log filters have been reset." });
  };

  const handleExport = (format: "CSV" | "Excel" | "PDF") => {
    toast({ 
        title: "Export Initiated (Simulated)", 
        description: `Preparing error logs report as ${format}.`,
    });
    console.log(`Simulating export of error logs as ${format}. Data:`, filteredErrorLogs);
  };
  
  const handleMarkResolved = (logId: string) => {
    setErrorLogs(prev => prev.map(log => log.id === logId ? {...log, isResolved: log.isResolved === "Yes" ? "No" : "Yes"} : log));
    toast({ title: "Status Updated", description: `Error log ${logId} resolution status toggled.`});
  };

  const handleRetryCall = (logId: string, callId: string) => {
    setErrorLogs(prev => prev.map(log => log.id === logId ? {...log, retryAttempted: "In Progress"} : log));
    toast({ title: "Retry Initiated", description: `Retrying call ${callId} for error log ${logId}. (Simulated)`});
    setTimeout(() => {
        setErrorLogs(prev => prev.map(log => log.id === logId ? {...log, retryAttempted: "Yes", isResolved: "Yes"} : log));
        toast({ title: "Retry Successful", description: `Call ${callId} (Error ${logId}) retried successfully.`});
    }, 2000);
  };

  const failureRate = filteredErrorLogs.length > 0 && initialMockErrorLogs.length > 0 ? (filteredErrorLogs.filter(log => log.errorType !== "No Answer").length / initialMockErrorLogs.length * 100).toFixed(1) + "%" : "N/A";
  const commonErrorType = filteredErrorLogs.length > 0 ? 
    Object.entries(filteredErrorLogs.reduce((acc, log) => { acc[log.errorType] = (acc[log.errorType] || 0) + 1; return acc; }, {} as Record<ErrorType, number>))
        .sort((a,b) => b[1] - a[1])[0]?.[0] || "N/A" 
    : "N/A";
  const affectedClientsCount = new Set(filteredErrorLogs.map(log => log.clientId)).size;
  const retriedCount = filteredErrorLogs.filter(log => log.retryAttempted === "Yes" || log.retryAttempted === "In Progress").length;


  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <ShieldAlert className="mr-3 h-8 w-8 text-destructive" /> Error & Failed Call Logs
          </h1>
          <p className="text-muted-foreground">
            Investigate system errors, failed calls, and manage resolutions.
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
          <CardTitle className="flex items-center"><ListFilter className="mr-2 h-5 w-5"/>Filter Error Logs</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">Date Range</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date-error" variant={"outline"} className={cn("w-full justify-start text-left font-normal h-9", !dateRange && "text-muted-foreground")}>
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
            <span className="text-sm font-medium">Error Type</span>
            <Select value={selectedErrorType} onValueChange={(value) => setSelectedErrorType(value as ErrorType | "all")}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Error Types</SelectItem>
                    {errorTypeOptions.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleApplyFilters} className="w-full h-9">Apply</Button>
            <Button onClick={handleResetFilters} variant="outline" className="w-full h-9"><FilterX className="mr-2 h-4 w-4"/> Reset</Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center"><AlertTriangle className="mr-2 h-4 w-4 text-red-500"/>Failure Rate</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{failureRate}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center"><Zap className="mr-2 h-4 w-4 text-orange-500"/>Common Error</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold truncate" title={commonErrorType}>{commonErrorType}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center"><Users className="mr-2 h-4 w-4 text-blue-500"/>Affected Clients</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{affectedClientsCount}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center"><RefreshCw className="mr-2 h-4 w-4 text-green-500"/>Retried Calls</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{retriedCount} / {filteredErrorLogs.length}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Error Log Details</CardTitle>
          <CardDescription>List of errors and failed calls based on current filters.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Call ID</TableHead>
                  <TableHead>Client / Campaign</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Error Type</TableHead>
                  <TableHead className="min-w-[200px]">Description</TableHead>
                  <TableHead>Resolved</TableHead>
                  <TableHead>Retried</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedErrorLogs.length > 0 ? paginatedErrorLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">{log.callId}</TableCell>
                    <TableCell>
                        <div>{log.clientName}</div>
                        <div className="text-xs text-muted-foreground">{log.campaignName}</div>
                    </TableCell>
                    <TableCell>{format(log.timestamp, "MMM dd, HH:mm:ss")}</TableCell>
                    <TableCell><Badge variant="destructive" className="text-xs">{log.errorType}</Badge></TableCell>
                    <TableCell className="text-xs max-w-sm truncate" title={log.errorDescription}>{log.errorDescription}</TableCell>
                    <TableCell><Badge className={cn("text-xs", resolvedStatusColors[log.isResolved])}>{log.isResolved}</Badge></TableCell>
                    <TableCell><Badge className={cn("text-xs", retryStatusColors[log.retryAttempted])}>{log.retryAttempted}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toast({title: "View Details", description: `Call ID: ${log.callId}`})}><Eye className="mr-2 h-4 w-4"/>View Full Details</DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onClick={() => handleMarkResolved(log.id)} disabled={log.isResolved === "Yes"}>
                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500"/>Mark Resolved
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleMarkResolved(log.id)} disabled={log.isResolved === "No" || log.isResolved === "Investigating"}>
                                <XCircle className="mr-2 h-4 w-4 text-red-500"/>Mark Unresolved
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRetryCall(log.id, log.callId)} disabled={log.retryAttempted === "Yes" || log.retryAttempted === "In Progress"}>
                                <RefreshCw className="mr-2 h-4 w-4 text-blue-500"/>Retry Call
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No error logs found for the selected criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
           <div className="text-xs text-muted-foreground">
             Showing <strong>{paginatedErrorLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong>
             - <strong>{Math.min(currentPage * itemsPerPage, filteredErrorLogs.length)}</strong> of <strong>{filteredErrorLogs.length}</strong> logs
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
