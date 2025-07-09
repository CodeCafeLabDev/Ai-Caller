
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/cn";
import { format, subDays, addDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  Users,
  Filter,
  Search,
  CalendarDays,
  Activity,
  Check,
  ChevronsUpDown,
  ListFilter,
  Megaphone,
  FileText,
  DollarSign,
  FilterX,
  Power,
  Eye,
} from "lucide-react";

type AffectedModule = "Campaigns" | "Agents" | "Billing" | "User Management" | "Settings";
type ActivityEntry = {
  id: string;
  timestamp: Date;
  clientName: string;
  clientId: string;
  user?: string; // Email or name of the client's user
  actionPerformed: string; // e.g., "Launched Campaign", "Created Agent"
  affectedModule: AffectedModule;
  details: string; // e.g., "Campaign 'Lead Nurture 1'", "Agent 'Loan Reminder Bot'"
};

const mockClients: { value: string; label: string }[] = [
  { value: "all", label: "All Clients" },
  { value: "client_1", label: "Innovate Corp" },
  { value: "client_2", label: "Solutions Ltd" },
  { value: "client_3", label: "Tech Ventures" },
];

const affectedModuleOptions: { value: AffectedModule | "all"; label: string }[] = [
  { value: "all", label: "All Modules" },
  { value: "Campaigns", label: "Campaigns" },
  { value: "Agents", label: "Agents" },
  { value: "Billing", label: "Billing" },
  { value: "User Management", label: "User Management" },
  { value: "Settings", label: "Settings" },
];

const initialMockActivities: ActivityEntry[] = [
  { id: "act_1", timestamp: subDays(new Date(), 0.1), clientName: "Innovate Corp", clientId: "client_1", user: "alice@innovate.com", actionPerformed: "Launched Campaign", affectedModule: "Campaigns", details: "Campaign 'Q4 Leads' (ID: camp_xyz)" },
  { id: "act_2", timestamp: subDays(new Date(), 0.5), clientName: "Solutions Ltd", clientId: "client_2", user: "bob@solutions.io", actionPerformed: "Created AI Agent", affectedModule: "Agents", details: "Agent 'Reminder Script v2' (ID: tpl_abc)" },
  { id: "act_3", timestamp: subDays(new Date(), 1), clientName: "Innovate Corp", clientId: "client_1", user: "admin@innovate.com", actionPerformed: "Updated Billing Info", affectedModule: "Billing", details: "Payment method updated to **** **** **** 1234" },
  { id: "act_4", timestamp: subDays(new Date(), 1.5), clientName: "Tech Ventures", clientId: "client_3", user: "carol@tech.dev", actionPerformed: "User Login", affectedModule: "User Management", details: "User carol@tech.dev logged in from IP 192.168.1.10" },
  { id: "act_5", timestamp: subDays(new Date(), 2), clientName: "Solutions Ltd", clientId: "client_2", user: "bob@solutions.io", actionPerformed: "Modified Campaign Settings", affectedModule: "Campaigns", details: "Campaign 'Summer Promo' daily call limit increased" },
];


export default function ClientActivityFeedPage() {
  const { toast } = useToast();
  const [activities, setActivities] = React.useState<ActivityEntry[]>(initialMockActivities);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({ from: subDays(new Date(), 7), to: new Date() });
  const [selectedClientId, setSelectedClientId] = React.useState<string>("all");
  const [selectedModule, setSelectedModule] = React.useState<AffectedModule | "all">("all");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isRealtime, setIsRealtime] = React.useState(false);

  const [clientOpen, setClientOpen] = React.useState(false);
  const [moduleOpen, setModuleOpen] = React.useState(false);

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const filteredActivities = React.useMemo(() => {
    return activities.filter(activity => {
      const dateMatch = dateRange?.from && dateRange?.to ?
        activity.timestamp >= dateRange.from && activity.timestamp <= addDays(dateRange.to, 1) : true;
      const clientMatch = selectedClientId === "all" || activity.clientId === selectedClientId;
      const moduleMatch = selectedModule === "all" || activity.affectedModule === selectedModule;
      const searchMatch = searchTerm === "" ||
        activity.actionPerformed.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (activity.user && activity.user.toLowerCase().includes(searchTerm.toLowerCase()));
      return dateMatch && clientMatch && moduleMatch && searchMatch;
    }).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [activities, dateRange, selectedClientId, selectedModule, searchTerm]);
  
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isRealtime) {
      intervalId = setInterval(() => {
        const newActivity: ActivityEntry = {
          id: `act_${Date.now()}`,
          timestamp: new Date(),
          clientName: mockClients[Math.floor(Math.random() * (mockClients.length -1)) + 1].label,
          clientId: mockClients[Math.floor(Math.random() * (mockClients.length -1)) + 1].value,
          user: `user${Math.floor(Math.random()*10)}@client.com`,
          actionPerformed: "API Key Accessed",
          affectedModule: "Settings",
          details: `Key prefix sk_live_...xyz used for /v1/status endpoint.`
        };
        setActivities(prev => [newActivity, ...prev]);
        if(currentPage === 1 && paginatedActivities.length >= itemsPerPage){
             // If on page 1 and full, this new item might push an old one to page 2
        } else if(currentPage > 1 && document.visibilityState === 'visible') {
             // Optionally show a small toast that new items arrived on page 1
        }

      }, 5000); // Add a new mock activity every 5 seconds
       toast({title: "Real-time Feed Active", description: "New activities will appear automatically."})
    } else {
       toast({title: "Real-time Feed Paused", description: "Feed updates are paused."})
    }
    return () => clearInterval(intervalId);
  }, [isRealtime]);


  const handleApplyFilters = () => {
    setCurrentPage(1);
    toast({ title: "Filters Applied", description: "Activity feed has been updated." });
  };

  const handleResetFilters = () => {
    setDateRange({ from: subDays(new Date(), 7), to: new Date() });
    setSelectedClientId("all");
    setSelectedModule("all");
    setSearchTerm("");
    setCurrentPage(1);
    toast({ title: "Filters Reset", description: "Activity feed filters have been reset." });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Client Activity Feed</h1>
          <p className="text-muted-foreground">Monitor real-time activities performed by client users.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5" />Filter Activity</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">Date Range</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date-activity" variant={"outline"} className={cn("w-full justify-start text-left font-normal h-9", !dateRange && "text-muted-foreground")}>
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
                  {mockClients.find(c => c.value === selectedClientId)?.label || "Select Client"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command>
                <CommandInput placeholder="Search client..." /><CommandList><CommandEmpty>No client.</CommandEmpty><CommandGroup>
                {mockClients.map(c => (<CommandItem key={c.value} value={c.label} onSelect={() => {setSelectedClientId(c.value); setClientOpen(false);}}><Check className={cn("mr-2 h-4 w-4", selectedClientId === c.value ? "opacity-100" : "opacity-0")}/>{c.label}</CommandItem>))}
              </CommandGroup></CommandList></Command></PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">Affected Module</span>
            <Popover open={moduleOpen} onOpenChange={setModuleOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between h-9">
                  {affectedModuleOptions.find(m => m.value === selectedModule)?.label || "Select Module"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command>
                <CommandInput placeholder="Search module..." /><CommandList><CommandEmpty>No module.</CommandEmpty><CommandGroup>
                {affectedModuleOptions.map(m => (<CommandItem key={m.value} value={m.label} onSelect={() => {setSelectedModule(m.value as AffectedModule | "all"); setModuleOpen(false);}}><Check className={cn("mr-2 h-4 w-4", selectedModule === m.value ? "opacity-100" : "opacity-0")}/>{m.label}</CommandItem>))}
              </CommandGroup></CommandList></Command></PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">Search Action/Details</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="e.g., Launched Campaign, User Login" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-9"/>
            </div>
          </div>
          <div className="flex gap-2 col-span-full md:col-span-1 xl:col-span-1 self-end">
            <Button onClick={handleApplyFilters} className="w-full h-9">Apply Filters</Button>
            <Button onClick={handleResetFilters} variant="outline" className="w-full h-9"><FilterX className="mr-2 h-4 w-4"/> Reset</Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center space-x-2 my-4">
        <Switch id="realtime-toggle" checked={isRealtime} onCheckedChange={setIsRealtime} />
        <Label htmlFor="realtime-toggle" className="text-sm">Enable Real-time Feed (Simulated)</Label>
      </div>

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/3">
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="timeline" disabled>Timeline View (Soon)</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Chronological list of client activities.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="text-xs">{format(activity.timestamp, "MMM dd, HH:mm:ss")}</TableCell>
                        <TableCell>{activity.clientName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{activity.user || "-"}</TableCell>
                        <TableCell className="font-medium text-sm">{activity.actionPerformed}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {activity.affectedModule === "Campaigns" && <Megaphone className="inline-block mr-1 h-3 w-3"/>}
                            {activity.affectedModule === "Agents" && <FileText className="inline-block mr-1 h-3 w-3"/>}
                            {activity.affectedModule === "Billing" && <DollarSign className="inline-block mr-1 h-3 w-3"/>}
                            {activity.affectedModule === "User Management" && <Users className="inline-block mr-1 h-3 w-3"/>}
                             {activity.affectedModule === "Settings" && <ListFilter className="inline-block mr-1 h-3 w-3"/>}
                            {activity.affectedModule}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-md truncate" title={activity.details}>{activity.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              {paginatedActivities.length === 0 && <p className="p-8 text-center text-muted-foreground">No client activity found for the selected filters.</p>}
            </CardContent>
             <CardFooter className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{paginatedActivities.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong>
                    - <strong>{Math.min(currentPage * itemsPerPage, filteredActivities.length)}</strong> of <strong>{filteredActivities.length}</strong> activities
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
                </div>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="timeline">
          <Card>
            <CardHeader><CardTitle>Timeline View (Placeholder)</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground">A visual timeline representation of activities will be available here soon.</p>
               {/* Basic list to simulate timeline */}
              <ul className="mt-4 space-y-4">
                {paginatedActivities.slice(0, 5).map(activity => (
                  <li key={`timeline-${activity.id}`} className="relative pl-6 after:absolute after:left-2 after:top-2 after:h-full after:w-px after:bg-border last:after:hidden">
                    <div className="absolute left-0 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                      <Activity className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                    <p className="text-sm font-medium">{activity.actionPerformed} <span className="text-xs text-muted-foreground">by {activity.user || activity.clientName}</span></p>
                    <p className="text-xs text-muted-foreground">{format(activity.timestamp, "MMM dd, HH:mm")} - {activity.details}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
