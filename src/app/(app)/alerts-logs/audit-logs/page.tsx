
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
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, subDays, addDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { FileText, Filter, UserCircle, CalendarDays, Search, ListFilter, RotateCcw, Server, Users, Edit3, Trash2, KeyRound } from "lucide-react";

type ActionType = 
  | "Client Updated" 
  | "Plan Changed" 
  | "Webhook Deleted" 
  | "Template Restored" 
  | "API Key Generated" 
  | "Role Updated" 
  | "User Created"
  | "System Action";

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  actor: string; // User email, name, or "System"
  actionType: ActionType;
  affectedEntity?: string; // e.g., Client Name, Template Name, Plan Name
  details: string; // Full descriptive log
  ipAddress?: string;
  deviceBrowser?: string;
}

const initialMockAuditLogs: AuditLogEntry[] = [
  { id: "log_1", timestamp: new Date(), actor: "SuperAdmin John", actionType: "Plan Changed", affectedEntity: "Client: Innovate Corp", details: "Edited Client Plan from Basic to Pro for Client: Innovate Corp", ipAddress: "192.168.1.100", deviceBrowser: "Chrome on macOS" },
  { id: "log_2", timestamp: subDays(new Date(), 1), actor: "api@voxaiomni.com", actionType: "Webhook Deleted", affectedEntity: "Client: XYZ Corp", details: "Webhook endpoint 'https://xyz.com/hooks' deleted for Client: XYZ Corp", ipAddress: "10.0.0.5" },
  { id: "log_3", timestamp: subDays(new Date(), 2), actor: "support@voxaiomni.com", actionType: "Template Restored", affectedEntity: "Template: Sales Call v2", details: "Script Template ‘Sales Call v2’ restored to Version 4", ipAddress: "203.0.113.45", deviceBrowser: "Firefox on Windows" },
  { id: "log_4", timestamp: subDays(new Date(), 3), actor: "System", actionType: "API Key Generated", affectedEntity: "Client: Tech Ventures", details: "New API Key generated for Client: Tech Ventures (Key ID: sk_live_...abc)", ipAddress: "N/A" },
  { id: "log_5", timestamp: subDays(new Date(), 4), actor: "admin@voxaiomni.com", actionType: "Role Updated", affectedEntity: "User: jane.doe@client.com", details: "User role for 'jane.doe@client.com' changed from Agent to Admin.", ipAddress: "172.16.0.10", deviceBrowser: "Safari on iOS" },
  { id: "log_6", timestamp: subDays(new Date(), 5), actor: "onboarding_service", actionType: "User Created", affectedEntity: "User: new.user@client.com", details: "New user 'new.user@client.com' created for Client: Global Connect.", ipAddress: "N/A" },
];

const actionTypeOptions: {value: ActionType | "all", label: string}[] = [
    {value: "all", label: "All Action Types"},
    {value: "Client Updated", label: "Client Updated"},
    {value: "Plan Changed", label: "Plan Changed"},
    {value: "Webhook Deleted", label: "Webhook Deleted"},
    {value: "Template Restored", label: "Template Restored"},
    {value: "API Key Generated", label: "API Key Generated"},
    {value: "Role Updated", label: "Role Updated"},
    {value: "User Created", label: "User Created"},
    {value: "System Action", label: "System Action"},
];

export default function AuditLogsPage() {
  const { toast } = useToast();
  const [auditLogs, setAuditLogs] = React.useState<AuditLogEntry[]>(initialMockAuditLogs);
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const [actorFilter, setActorFilter] = React.useState("");
  const [clientFilter, setClientFilter] = React.useState("");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [actionTypeFilter, setActionTypeFilter] = React.useState<ActionType | "all">("all");
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const filteredLogs = React.useMemo(() => {
    return auditLogs.filter(log => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const lowerActorFilter = actorFilter.toLowerCase();
      const lowerClientFilter = clientFilter.toLowerCase();

      const dateMatch = dateRange?.from && dateRange?.to ? 
        log.timestamp >= dateRange.from && log.timestamp <= addDays(dateRange.to, 1) : true;
      
      const searchMatch = searchTerm === "" || 
        log.details.toLowerCase().includes(lowerSearchTerm) ||
        (log.affectedEntity && log.affectedEntity.toLowerCase().includes(lowerSearchTerm));
        
      const actorMatch = actorFilter === "" || log.actor.toLowerCase().includes(lowerActorFilter);
      const clientMatch = clientFilter === "" || 
        (log.affectedEntity && log.affectedEntity.toLowerCase().includes(lowerClientFilter)) || 
        log.details.toLowerCase().includes(lowerClientFilter); // Check details also for client mentions
      
      const actionTypeMatch = actionTypeFilter === "all" || log.actionType === actionTypeFilter;
      
      return dateMatch && searchMatch && actorMatch && clientMatch && actionTypeMatch;
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [auditLogs, searchTerm, actorFilter, clientFilter, dateRange, actionTypeFilter]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleApplyFilters = () => {
    setCurrentPage(1);
    toast({ title: "Filters Applied", description: "Audit log data has been updated." });
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setActorFilter("");
    setClientFilter("");
    setDateRange({ from: subDays(new Date(), 7), to: new Date() });
    setActionTypeFilter("all");
    setCurrentPage(1);
    toast({ title: "Filters Reset", description: "Audit log filters have been reset." });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Audit Logs</h1>
          <p className="text-muted-foreground">Track significant actions and changes within the system.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5"/>Filter Audit Logs</CardTitle>
          <CardDescription>Search and filter logs by various criteria.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">Search Details/Entity</span>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Keyword in details or entity..." className="pl-10 h-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">Actor (User/System)</span>
            <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Filter by Actor ID or Email" className="pl-10 h-9" value={actorFilter} onChange={e => setActorFilter(e.target.value)}/>
            </div>
          </div>
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">Client Affected</span>
            <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Filter by Client Name/ID" className="pl-10 h-9" value={clientFilter} onChange={e => setClientFilter(e.target.value)}/>
            </div>
          </div>
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">Date Range</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date-audit" variant={"outline"} className={cn("w-full justify-start text-left font-normal h-9", !dateRange && "text-muted-foreground")}>
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
            <span className="text-sm font-medium">Action Type</span>
            <Select value={actionTypeFilter} onValueChange={(value) => setActionTypeFilter(value as ActionType | "all")}>
                <SelectTrigger className="h-9">
                    <ListFilter className="mr-2 h-3.5 w-3.5 opacity-70"/> <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {actionTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 items-end">
            <Button onClick={handleApplyFilters} className="w-full h-9">Apply Filters</Button>
            <Button onClick={handleResetFilters} variant="outline" className="w-full h-9">Reset</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Log Entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Affected Entity</TableHead>
                  <TableHead className="min-w-[300px]">Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Undo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">{format(log.timestamp, "MMM dd, yyyy HH:mm:ss")}</TableCell>
                    <TableCell className="text-sm">{log.actor}</TableCell>
                    <TableCell className="font-medium text-sm">
                        <Badge variant={
                            log.actionType.includes("Delete") || log.actionType.includes("Revoked") ? "destructive" : 
                            log.actionType.includes("Create") || log.actionType.includes("Generated") || log.actionType.includes("Restored") ? "default" :
                            log.actionType.includes("Update") || log.actionType.includes("Changed") || log.actionType.includes("Edited") ? "secondary" :
                            "outline"
                        } className="text-xs whitespace-nowrap">
                            {log.actionType.startsWith("API") ? <KeyRound className="inline-block mr-1 h-3 w-3"/> : 
                             log.actionType.includes("Client") ? <Users className="inline-block mr-1 h-3 w-3"/> : 
                             log.actionType.includes("Template") ? <Edit3 className="inline-block mr-1 h-3 w-3"/> :
                             log.actionType.includes("Webhook") ? <Trash2 className="inline-block mr-1 h-3 w-3"/> : // Assuming Webhook Deleted for now
                             log.actionType.includes("Role") || log.actionType.includes("User") ? <UserCircle className="inline-block mr-1 h-3 w-3"/> :
                             <Server className="inline-block mr-1 h-3 w-3"/>}
                            {log.actionType}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.affectedEntity || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.details}</TableCell>
                    <TableCell className="text-xs font-mono">{log.ipAddress || "-"}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="sm" disabled title="Undo action (not implemented)">
                            <RotateCcw className="h-3.5 w-3.5"/>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
           {paginatedLogs.length === 0 && <p className="p-8 text-center text-muted-foreground">No audit logs found matching your criteria.</p>}
        </CardContent>
        <CardFooter className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
           <div className="text-xs text-muted-foreground">
             Showing <strong>{paginatedLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong>
             -<strong>{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</strong> of <strong>{filteredLogs.length}</strong> logs
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


    