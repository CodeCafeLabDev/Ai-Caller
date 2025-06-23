
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
import { History, Filter, UserCircle, MapPin, CalendarDays, Search, CheckCircle, XCircle, Smartphone, ShieldCheck, KeyRound, LogOut, Ban, MoreHorizontal, FilterX, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type LoginStatus = "Success" | "Failed";
type DeviceType = "Desktop" | "Mobile" | "Tablet" | "Unknown";
type TwoFAStatus = "Enabled" | "Disabled" | "Not Attempted";

interface LoginHistoryEntry {
  id: string;
  timestamp: Date;
  user: string;
  role: string;
  ipAddress: string;
  location: string; // e.g., "New York, USA"
  deviceType: DeviceType;
  status: LoginStatus;
  reason: string; // e.g., "Invalid password", "Successful login"
  twoFAStatus: TwoFAStatus;
}

const initialMockLoginHistory: LoginHistoryEntry[] = [
  { id: "log_1", timestamp: new Date(), user: "admin@AI Caller.com", role: "Admin", ipAddress: "192.168.1.100", location: "New York, USA", deviceType: "Desktop", status: "Success", reason: "Successful login", twoFAStatus: "Enabled" },
  { id: "log_2", timestamp: subDays(new Date(), 1), user: "client_admin@innovate.com", role: "Client Admin", ipAddress: "10.0.0.5", location: "London, UK", deviceType: "Mobile", status: "Success", reason: "Successful login", twoFAStatus: "Enabled" },
  { id: "log_3", timestamp: subDays(new Date(), 2), user: "unknown_user", role: "N/A", ipAddress: "203.0.113.45", location: "Unknown", deviceType: "Unknown", status: "Failed", reason: "Invalid username or password", twoFAStatus: "Not Attempted" },
  { id: "log_4", timestamp: subDays(new Date(), 3), user: "agent1@AI Caller.com", role: "Agent", ipAddress: "172.16.0.10", location: "Paris, France", deviceType: "Tablet", status: "Failed", reason: "Incorrect 2FA code", twoFAStatus: "Enabled" },
  { id: "log_5", timestamp: subDays(new Date(), 4), user: "support@AI Caller.com", role: "Support", ipAddress: "198.51.100.2", location: "Berlin, Germany", deviceType: "Desktop", status: "Success", reason: "Successful login", twoFAStatus: "Disabled" },
];

const deviceTypeOptions: (DeviceType | "All")[] = ["All", "Desktop", "Mobile", "Tablet", "Unknown"];
const loginStatusOptions: (LoginStatus | "All")[] = ["All", "Success", "Failed"];
const twoFAStatusOptions: (TwoFAStatus | "All")[] = ["All", "Enabled", "Disabled", "Not Attempted"];

export default function LoginHistoryPage() {
  const { toast } = useToast();
  const [loginHistory, setLoginHistory] = React.useState<LoginHistoryEntry[]>(initialMockLoginHistory);
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const [ipFilter, setIpFilter] = React.useState("");
  const [deviceFilter, setDeviceFilter] = React.useState<DeviceType | "All">("All");
  const [statusFilter, setStatusFilter] = React.useState<LoginStatus | "All">("All");
  const [twoFAFilter, setTwoFAFilter] = React.useState<TwoFAStatus | "All">("All");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const filteredLogs = React.useMemo(() => {
    return loginHistory.filter(log => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const searchMatch = searchTerm === "" || 
        log.user.toLowerCase().includes(lowerSearchTerm) ||
        log.location.toLowerCase().includes(lowerSearchTerm) ||
        log.role.toLowerCase().includes(lowerSearchTerm) ||
        log.reason.toLowerCase().includes(lowerSearchTerm);

      const dateMatch = dateRange?.from && dateRange?.to ? 
        log.timestamp >= dateRange.from && log.timestamp <= addDays(dateRange.to, 1) : true;
      
      const ipMatch = ipFilter === "" || log.ipAddress.includes(ipFilter);
      const deviceMatch = deviceFilter === "All" || log.deviceType === deviceFilter;
      const statusMatch = statusFilter === "All" || log.status === statusFilter;
      const twoFAMatch = twoFAFilter === "All" || log.twoFAStatus === twoFAFilter;
      
      return searchMatch && dateMatch && ipMatch && deviceMatch && statusMatch && twoFAMatch;
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [loginHistory, searchTerm, ipFilter, deviceFilter, statusFilter, twoFAFilter, dateRange]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleApplyFilters = () => {
    setCurrentPage(1);
    toast({ title: "Filters Applied", description: "Login history has been updated." });
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setIpFilter("");
    setDeviceFilter("All");
    setStatusFilter("All");
    setTwoFAFilter("All");
    setDateRange({ from: subDays(new Date(), 7), to: new Date() });
    setCurrentPage(1);
    toast({ title: "Filters Reset", description: "Login history filters have been reset." });
  };

  const handleAction = (action: string, userId: string, logId: string) => {
     toast({ title: `Action: ${action}`, description: `Performed on user ${userId} (Log ID: ${logId}). (Simulated)` });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3">
        <History className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Login History</h1>
          <p className="text-muted-foreground">Review login attempts and access patterns for all users.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5"/>Filter Login History</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">Search User/Location/Role</span>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="e.g., admin@example.com, New York" className="pl-10 h-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">IP Address</span>
             <Input placeholder="e.g., 192.168.1.1" className="h-9" value={ipFilter} onChange={e => setIpFilter(e.target.value)}/>
          </div>
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">Date Range</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date-login" variant={"outline"} className={cn("w-full justify-start text-left font-normal h-9", !dateRange && "text-muted-foreground")}>
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
            <span className="text-sm font-medium">Device Type</span>
            <Select value={deviceFilter} onValueChange={(value) => setDeviceFilter(value as DeviceType | "All")}>
                <SelectTrigger className="h-9"><Smartphone className="mr-2 h-4 w-4 opacity-50"/> <SelectValue /></SelectTrigger>
                <SelectContent>
                    {deviceTypeOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">Status</span>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as LoginStatus | "All")}>
                <SelectTrigger className="h-9">
                    {statusFilter === "Success" && <CheckCircle className="mr-2 h-4 w-4 text-green-500"/>}
                    {statusFilter === "Failed" && <XCircle className="mr-2 h-4 w-4 text-red-500"/>}
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {loginStatusOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
           <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">2FA Status</span>
            <Select value={twoFAFilter} onValueChange={(value) => setTwoFAFilter(value as TwoFAStatus | "All")}>
                <SelectTrigger className="h-9"><ShieldCheck className="mr-2 h-4 w-4 opacity-50"/> <SelectValue /></SelectTrigger>
                <SelectContent>
                    {twoFAStatusOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
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
          <CardTitle>Recent Login Attempts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead><UserCircle className="inline-block mr-1 h-4 w-4" />User</TableHead>
                  <TableHead><UserCog className="inline-block mr-1 h-4 w-4" />Role</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead><MapPin className="inline-block mr-1 h-4 w-4" />Location</TableHead>
                  <TableHead><Smartphone className="inline-block mr-1 h-4 w-4" />Device</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead><KeyRound className="inline-block mr-1 h-4 w-4" />2FA</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">{format(log.timestamp, "MMM dd, yyyy HH:mm:ss")}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.role}</TableCell>
                    <TableCell className="font-mono text-xs">{log.ipAddress}</TableCell>
                    <TableCell>{log.location}</TableCell>
                    <TableCell>{log.deviceType}</TableCell>
                    <TableCell>
                      <Badge variant={log.status === "Success" ? "default" : "destructive"} className={`flex items-center gap-1 w-fit ${log.status === "Success" ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {log.status === "Success" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {log.status}
                      </Badge>
                    </TableCell>
                     <TableCell>
                      <Badge variant={log.twoFAStatus === "Enabled" ? "secondary" : "outline"} className={`text-xs ${log.twoFAStatus === "Enabled" ? 'border-green-500 text-green-700' : log.twoFAStatus === 'Disabled' ? 'border-red-500 text-red-700' : ''}`}>
                        {log.twoFAStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={log.reason}>{log.reason}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Session Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleAction("Force Logout", log.user, log.id)} disabled={log.status === "Failed"}>
                            <LogOut className="mr-2 h-4 w-4" /> Force Logout
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction("Block IP", log.user, log.id)} className="text-destructive focus:text-destructive">
                            <Ban className="mr-2 h-4 w-4" /> Block IP Address
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          {paginatedLogs.length === 0 && <p className="p-8 text-center text-muted-foreground">No login history found matching your criteria.</p>}
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

    