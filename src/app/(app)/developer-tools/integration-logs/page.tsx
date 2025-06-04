
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, subDays, addDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  ListChecks,
  Search,
  Filter,
  CalendarDays,
  FileDown,
  FilterX,
  MoreHorizontal,
  Eye,
  RefreshCw,
  ChevronsUpDown,
  Check,
  ClipboardList,
  Webhook,
  AlertCircle,
  ServerIcon,
  MessageSquare,
} from "lucide-react";

type LogType = "API Call" | "Webhook";
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "ALL";
type LogStatusFilter = "All" | "Success" | "Failure";

interface LogEntry {
  id: string;
  timestamp: Date;
  clientName: string;
  clientId: string;
  type: LogType;
  endpoint: string;
  method?: HttpMethod;
  responseCode: number;
  errorMessage?: string;
  retryAttempted?: boolean;
  requestBody?: string; // Simplified for now
  responseBody?: string; // Simplified for now
}

const mockClients = [
  { id: "all", name: "All Clients" },
  { id: "client_1", name: "Innovate Corp" },
  { id: "client_2", name: "Solutions Ltd" },
  { id: "client_3", name: "Tech Ventures" },
];

const initialLogs: LogEntry[] = [
  { id: "log1", timestamp: subDays(new Date(), 1), clientName: "Innovate Corp", clientId: "client_1", type: "API Call", endpoint: "/v1/campaigns", method: "POST", responseCode: 201, requestBody: JSON.stringify({ name: "Q1 Promo" }), responseBody: JSON.stringify({ id: "camp_xyz" }) },
  { id: "log2", timestamp: subDays(new Date(), 2), clientName: "Solutions Ltd", clientId: "client_2", type: "Webhook", endpoint: "https://hooks.solutions.io/call-end", responseCode: 200, retryAttempted: false, requestBody: JSON.stringify({ callId: "call_123", status: "completed" }) },
  { id: "log3", timestamp: subDays(new Date(), 0), clientName: "Tech Ventures", clientId: "client_3", type: "API Call", endpoint: "/v1/calls/initiate", method: "POST", responseCode: 401, errorMessage: "Invalid API Key", requestBody: JSON.stringify({ to: "+1234567890" }) },
  { id: "log4", timestamp: subDays(new Date(), 3), clientName: "Innovate Corp", clientId: "client_1", type: "Webhook", endpoint: "https://hooks.innovatecorp.com/failed-payment", responseCode: 500, errorMessage: "Internal server error on client side", retryAttempted: true, requestBody: JSON.stringify({ invoiceId: "inv_abc", status: "failed" }) },
  { id: "log5", timestamp: subDays(new Date(), 4), clientName: "Innovate Corp", clientId: "client_1", type: "API Call", endpoint: "/v1/templates/tpl_abc", method: "GET", responseCode: 200, responseBody: JSON.stringify({ name: "Welcome Script" })},
];

const httpMethods: HttpMethod[] = ["ALL", "GET", "POST", "PUT", "DELETE", "PATCH"];
const logStatusOptions: LogStatusFilter[] = ["All", "Success", "Failure"];
const logTypeOptions: (LogType | "All")[] = ["All", "API Call", "Webhook"];

export default function IntegrationLogsPage() {
  const { toast } = useToast();
  const [logs, setLogs] = React.useState<LogEntry[]>(initialLogs);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({ from: subDays(new Date(), 7), to: new Date() });
  const [selectedClientId, setSelectedClientId] = React.useState<string>("all");
  const [endpointFilter, setEndpointFilter] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<LogStatusFilter>("All");
  const [methodFilter, setMethodFilter] = React.useState<HttpMethod>("ALL");
  const [typeFilter, setTypeFilter] = React.useState<LogType | "All">("All");

  const [clientOpen, setClientOpen] = React.useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false);
  const [selectedLogForDetails, setSelectedLogForDetails] = React.useState<LogEntry | null>(null);
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const filteredLogs = React.useMemo(() => {
    return logs.filter(log => {
      const dateMatch = dateRange?.from && dateRange?.to ? 
        log.timestamp >= dateRange.from && log.timestamp <= addDays(dateRange.to, 1) : true;
      const clientMatch = selectedClientId === "all" || log.clientId === selectedClientId;
      const endpointMatch = endpointFilter === "" || log.endpoint.toLowerCase().includes(endpointFilter.toLowerCase());
      const statusMatch = statusFilter === "All" || (statusFilter === "Success" && log.responseCode < 400) || (statusFilter === "Failure" && log.responseCode >= 400);
      const methodMatch = methodFilter === "ALL" || (log.type === "API Call" && log.method === methodFilter);
      const typeMatch = typeFilter === "All" || log.type === typeFilter;
      return dateMatch && clientMatch && endpointMatch && statusMatch && methodMatch && typeMatch;
    });
  }, [logs, dateRange, selectedClientId, endpointFilter, statusFilter, methodFilter, typeFilter]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleApplyFilters = () => {
    setCurrentPage(1);
    toast({ title: "Filters Applied", description: "Integration log data has been updated." });
  };

  const handleResetFilters = () => {
    setDateRange({ from: subDays(new Date(), 7), to: new Date() });
    setSelectedClientId("all");
    setEndpointFilter("");
    setStatusFilter("All");
    setMethodFilter("ALL");
    setTypeFilter("All");
    setCurrentPage(1);
    toast({ title: "Filters Reset", description: "Integration log filters have been reset." });
  };

  const handleDownloadLogs = (format: "CSV" | "JSON") => {
    toast({ title: `Download Logs (${format})`, description: "Log download initiated (Simulated)." });
    console.log(`Simulating download of logs as ${format}:`, filteredLogs);
  };

  const handleViewDetails = (log: LogEntry) => {
    setSelectedLogForDetails(log);
    setIsDetailsModalOpen(true);
  };

  const handleRetryWebhook = (logId: string) => {
    toast({ title: "Retry Webhook", description: `Webhook retry initiated for log ${logId} (Simulated).` });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <ClipboardList className="mr-3 h-8 w-8 text-primary" /> API Integration Logs
          </h1>
          <p className="text-muted-foreground">
            Monitor and review all API interactions and webhook deliveries.
          </p>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline"><FileDown className="mr-2 h-4 w-4"/>Download Logs</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleDownloadLogs("CSV")}>Download as CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadLogs("JSON")}>Download as JSON</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5"/>Filter Logs</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col space-y-1.5">
                <span className="text-sm font-medium">Date Range</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="date-integration" variant={"outline"} className={cn("w-full justify-start text-left font-normal h-9", !dateRange && "text-muted-foreground")}>
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
                <span className="text-sm font-medium">Client</span>
                 <Popover open={clientOpen} onOpenChange={setClientOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between h-9">
                        {mockClients.find(c => c.id === selectedClientId)?.name || "Select Client"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command>
                        <CommandInput placeholder="Search client..." />
                        <CommandList><CommandEmpty>No client.</CommandEmpty><CommandGroup>
                        {mockClients.map(c => (<CommandItem key={c.id} value={c.name} onSelect={() => {setSelectedClientId(c.id); setClientOpen(false);}}><Check className={cn("mr-2 h-4 w-4", selectedClientId === c.id ? "opacity-100" : "opacity-0")}/>{c.name}</CommandItem>))}
                    </CommandGroup></CommandList></Command></PopoverContent>
                </Popover>
            </div>
            <div className="flex flex-col space-y-1.5">
                <span className="text-sm font-medium">Endpoint URL</span>
                <Input placeholder="e.g., /v1/campaigns" value={endpointFilter} onChange={e => setEndpointFilter(e.target.value)} className="h-9"/>
            </div>
            <div className="flex flex-col space-y-1.5">
                <span className="text-sm font-medium">Status</span>
                 <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as LogStatusFilter)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {logStatusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div className="flex flex-col space-y-1.5">
                <span className="text-sm font-medium">HTTP Method</span>
                 <Select value={methodFilter} onValueChange={(value) => setMethodFilter(value as HttpMethod)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {httpMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-col space-y-1.5">
                <span className="text-sm font-medium">Log Type</span>
                 <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as LogType | "All")}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {logTypeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex gap-2 col-span-full md:col-span-1 xl:col-span-2 self-end">
                <Button onClick={handleApplyFilters} className="w-full h-9">Apply Filters</Button>
                <Button onClick={handleResetFilters} variant="outline" className="w-full h-9"><FilterX className="mr-2 h-4 w-4"/>Reset</Button>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log Entries</CardTitle>
          <CardDescription>Detailed history of API calls and webhook deliveries.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[600px] border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.length > 0 ? paginatedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{format(log.timestamp, "MMM dd, HH:mm:ss")}</TableCell>
                    <TableCell>{log.clientName}</TableCell>
                    <TableCell>
                        <Badge variant={log.type === "API Call" ? "secondary" : "outline"} className="text-xs">
                            {log.type === "API Call" ? <ServerIcon className="mr-1 h-3 w-3"/> : <Webhook className="mr-1 h-3 w-3"/>}
                            {log.type}
                        </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-xs truncate" title={log.endpoint}>{log.endpoint}</TableCell>
                    <TableCell>{log.method || "-"}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", log.responseCode < 400 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                        {log.responseCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-destructive max-w-xs truncate" title={log.errorMessage}>
                        {log.errorMessage || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(log)}><Eye className="mr-2 h-4 w-4"/>View Details</DropdownMenuItem>
                          {log.type === "Webhook" && log.responseCode >= 400 && (
                            <DropdownMenuItem onClick={() => handleRetryWebhook(log.id)} disabled={log.retryAttempted}>
                              <RefreshCw className="mr-2 h-4 w-4"/>Retry Webhook
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No logs found matching criteria.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
           <div className="text-xs text-muted-foreground">
             Showing <strong>{paginatedLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong>
             - <strong>{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</strong> of <strong>{filteredLogs.length}</strong> logs
           </div>
           <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
           </div>
        </CardFooter>
      </Card>

      {selectedLogForDetails && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Log Details: {selectedLogForDetails.id}</DialogTitle>
                    <DialogDescription>
                        {selectedLogForDetails.type} to {selectedLogForDetails.endpoint} for {selectedLogForDetails.clientName} at {format(selectedLogForDetails.timestamp, "PPPp")}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] mt-4">
                    <div className="space-y-4 p-1">
                        {selectedLogForDetails.requestBody && (
                            <div>
                                <h4 className="font-semibold mb-1">Request Body:</h4>
                                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">{JSON.stringify(JSON.parse(selectedLogForDetails.requestBody), null, 2)}</pre>
                            </div>
                        )}
                         {selectedLogForDetails.responseBody && (
                            <div>
                                <h4 className="font-semibold mb-1">Response Body:</h4>
                                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">{JSON.stringify(JSON.parse(selectedLogForDetails.responseBody), null, 2)}</pre>
                            </div>
                        )}
                        {!selectedLogForDetails.requestBody && !selectedLogForDetails.responseBody && (
                            <p className="text-sm text-muted-foreground">No request or response body available for this log entry.</p>
                        )}
                    </div>
                </ScrollArea>
                <DialogFooter className="mt-4">
                    <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

    
