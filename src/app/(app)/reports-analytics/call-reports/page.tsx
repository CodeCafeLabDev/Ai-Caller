
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
import { Input } from "@/components/ui/input"; // Added Input for potential future use
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
} from "lucide-react";

type CallStatus = "Completed" | "Failed" | "Missed" | "Answered" | "All";
type ReportEntry = {
  id: string;
  date: Date;
  clientName: string;
  campaignName: string;
  totalCalls: number;
  connectedRate: number; // percentage
  avgDurationMinutes: number;
  statusSummary: Record<"Completed" | "Failed" | "Missed" | "Answered", number>;
};

type FilterOption = {
  value: string;
  label: string;
};

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

const callStatuses: CallStatus[] = ["All", "Completed", "Failed", "Missed", "Answered"];

const mockReportData: ReportEntry[] = [
  { id: "rep_1", date: subDays(new Date(), 1), clientName: "Innovate Corp", campaignName: "Q4 Lead Generation", totalCalls: 150, connectedRate: 85, avgDurationMinutes: 5, statusSummary: { Completed: 120, Failed: 20, Missed: 5, Answered: 125 } },
  { id: "rep_2", date: subDays(new Date(), 1), clientName: "Solutions Ltd", campaignName: "New Product Launch", totalCalls: 90, connectedRate: 70, avgDurationMinutes: 3, statusSummary: { Completed: 60, Failed: 15, Missed: 15, Answered: 75 } },
  { id: "rep_3", date: subDays(new Date(), 2), clientName: "Innovate Corp", campaignName: "Q4 Lead Generation", totalCalls: 160, connectedRate: 90, avgDurationMinutes: 6, statusSummary: { Completed: 140, Failed: 10, Missed: 10, Answered: 150 } },
  { id: "rep_4", date: subDays(new Date(), 7), clientName: "Tech Ventures", campaignName: "Feedback Drive", totalCalls: 200, connectedRate: 95, avgDurationMinutes: 2, statusSummary: { Completed: 190, Failed: 5, Missed: 5, Answered: 195 } },
   { id: "rep_5", date: subDays(new Date(), 30), clientName: "Solutions Ltd", campaignName: "Old Campaign", totalCalls: 500, connectedRate: 60, avgDurationMinutes: 4, statusSummary: { Completed: 300, Failed: 150, Missed: 50, Answered: 350 } },
];

const kpiData = {
    totalCallsPlaced: 2350,
    successfulCalls: 2100,
    averageDuration: "4:15 min",
    pickupRate: "89%",
    aiConversationSuccessRate: "75%",
    callsByLanguage: { English: 1800, Spanish: 450, French: 100 },
};

type ExportFormat = "CSV" | "Excel" | "PDF";
type ReportPeriod = "Current View" | "Daily Summary" | "Weekly Summary" | "Monthly Summary";


export default function CallReportsPage() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [selectedClientId, setSelectedClientId] = React.useState<string>("all");
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string>("all");
  const [selectedStatus, setSelectedStatus] = React.useState<CallStatus>("All");

  const [clientOpen, setClientOpen] = React.useState(false);
  const [campaignOpen, setCampaignOpen] = React.useState(false);
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const filteredData = React.useMemo(() => {
    return mockReportData.filter(entry => {
      const dateMatch = dateRange?.from && dateRange?.to ? 
        entry.date >= dateRange.from && entry.date <= addDays(dateRange.to, 1) : true; 
      const clientMatch = selectedClientId === "all" || mockClients.find(c=>c.label === entry.clientName)?.value === selectedClientId;
      const campaignMatch = selectedCampaignId === "all" || mockCampaigns.find(c=>c.label === entry.campaignName)?.value === selectedCampaignId;
      return dateMatch && clientMatch && campaignMatch;
    });
  }, [dateRange, selectedClientId, selectedCampaignId]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleApplyFilters = () => {
    setCurrentPage(1); 
    toast({ title: "Filters Applied", description: "Report data has been updated based on your selections." });
  };

  const handleResetFilters = () => {
    setDateRange({ from: subDays(new Date(), 7), to: new Date() });
    setSelectedClientId("all");
    setSelectedCampaignId("all");
    setSelectedStatus("All");
    setCurrentPage(1);
    toast({ title: "Filters Reset", description: "Report filters have been reset to default." });
  };

  const handleExport = (format: ExportFormat, period: ReportPeriod) => {
    toast({ 
        title: "Export Initiated (Simulated)", 
        description: `Preparing ${period} report as ${format}. This would include fields like Call ID, Client Name, Campaign, Phone (masked), Status, Duration, Timestamp, AI Template.`,
        duration: 5000,
    });
    console.log(`Simulating export of ${period} as ${format}. Intended fields: Call ID, Client Name, Campaign Name, Phone Number (masked), Status, Duration, Timestamp, AI Template Used. Current filtered (summarized) data:`, filteredData);
  };

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
                  {mockClients.find(client => client.value === selectedClientId)?.label || "Select Client"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search client..." />
                  <CommandList><CommandEmpty>No client found.</CommandEmpty>
                  <CommandGroup>
                    {mockClients.map(client => (
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
            <Popover open={campaignOpen} onOpenChange={setCampaignOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={campaignOpen} className="w-full justify-between h-9">
                  <Megaphone className="mr-2 h-4 w-4 opacity-50 shrink-0" />
                  {mockCampaigns.find(campaign => campaign.value === selectedCampaignId)?.label || "Select Campaign"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search campaign..." />
                  <CommandList><CommandEmpty>No campaign found.</CommandEmpty>
                  <CommandGroup>
                    {mockCampaigns.map(campaign => (
                      <CommandItem key={campaign.value} value={campaign.label} onSelect={() => { setSelectedCampaignId(campaign.value); setCampaignOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", selectedCampaignId === campaign.value ? "opacity-100" : "opacity-0")} />
                        {campaign.label}
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

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle className="flex items-center"><LineChart className="mr-2 h-5 w-5"/>Calls Over Time</CardTitle></CardHeader>
          <CardContent>
            <Image data-ai-hint="line chart calls" src="https://placehold.co/600x400.png?text=Calls/Day+Chart" alt="Calls per day chart placeholder" width={600} height={400} className="rounded-md w-full"/>
          </CardContent>
        </Card>
        <Card className="md:col-span-1">
          <CardHeader><CardTitle className="flex items-center"><PieChartIcon className="mr-2 h-5 w-5"/>Call Status Breakdown</CardTitle></CardHeader>
          <CardContent>
            <Image data-ai-hint="pie chart status" src="https://placehold.co/400x400.png?text=Status+Pie+Chart" alt="Status breakdown pie chart placeholder" width={400} height={400} className="rounded-md w-full aspect-square object-cover"/>
          </CardContent>
        </Card>
        <Card className="md:col-span-1">
          <CardHeader><CardTitle className="flex items-center"><BarChartBig className="mr-2 h-5 w-5"/>Calls by Client/Campaign</CardTitle></CardHeader>
          <CardContent>
             <Image data-ai-hint="bar chart clients" src="https://placehold.co/600x400.png?text=Calls+by+Client+Chart" alt="Calls by client bar chart placeholder" width={600} height={400} className="rounded-md w-full"/>
          </CardContent>
        </Card>
      </div>

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
                  <TableHead>Client</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="text-right">Total Calls</TableHead>
                  <TableHead className="text-right">Connected %</TableHead>
                  <TableHead className="text-right">Avg. Duration (min)</TableHead>
                  <TableHead>Status Summary (C/F/M/A)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? paginatedData.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{format(entry.date, "MMM dd, yyyy")}</TableCell>
                    <TableCell>{entry.clientName}</TableCell>
                    <TableCell>{entry.campaignName}</TableCell>
                    <TableCell className="text-right">{entry.totalCalls}</TableCell>
                    <TableCell className="text-right">{entry.connectedRate}%</TableCell>
                    <TableCell className="text-right">{entry.avgDurationMinutes.toFixed(1)}</TableCell>
                    <TableCell>
                        <div className="flex gap-1 flex-wrap">
                            <Badge variant="secondary" className="text-xs">C: {entry.statusSummary.Completed}</Badge>
                            <Badge variant="destructive" className="text-xs">F: {entry.statusSummary.Failed}</Badge>
                            <Badge variant="outline" className="text-xs">M: {entry.statusSummary.Missed}</Badge>
                            <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">A: {entry.statusSummary.Answered}</Badge>
                        </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No data available for the selected filters.
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
    </div>
  );
}

    