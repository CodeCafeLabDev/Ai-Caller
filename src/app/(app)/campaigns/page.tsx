
"use client";

import * as React from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AddCampaignForm } from "@/components/campaigns/add-campaign-form"; 
import {
  Search,
  ListFilter,
  MoreHorizontal,
  Eye,
  PlayCircle,
  PauseCircle,
  Trash2,
  ArrowUpDown,
  FileDown,
  Check,
  ChevronsUpDown,
  Users,
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  Rocket,
  RefreshCcw,
  BellRing,
  PlusCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, addDays, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Label } from "@/components/ui/label";
import type { Metadata } from 'next';

// export const metadata: Metadata = {
//   title: 'Manage Campaigns - AI Caller',
//   description: 'Oversee, control, and create calling campaigns. Filter and sort campaigns by various criteria.',
//   keywords: ['campaign management', 'calling campaigns', 'outbound calls', 'lead generation', 'AI Caller'],
// };

export type CampaignStatus = "Active" | "Paused" | "Completed";
export type CampaignType = "Outbound" | "Follow-Up" | "Reminder";
type SuccessRateFilter = "all" | "low" | "high"; // low < 70%, high >= 70%
type SortByType = "latest" | "totalCalls" | "successRate";

export type Campaign = {
  id: string;
  name: string;
  clientName: string;
  clientId: string;
  tags: string[];
  type: CampaignType;
  callsAttempted: number;
  callsTargeted: number;
  startDate: Date;
  endDate: Date;
  status: CampaignStatus;
  successRate: number; // 0-100
  representativePhoneNumber?: string; 
};

export const mockClientsForFilter = [
  { id: "client_1", name: "Innovate Corp" },
  { id: "client_2", name: "Solutions Ltd" },
  { id: "client_3", name: "Tech Ventures" },
  { id: "client_4", name: "Global Connect" },
];

const mockCampaigns: Campaign[] = [
  {
    id: "camp_1",
    name: "Q4 Lead Generation",
    clientName: "Innovate Corp",
    clientId: "client_1",
    tags: ["leadgen", "q4", "sales"],
    type: "Outbound",
    callsAttempted: 450,
    callsTargeted: 500,
    startDate: subDays(new Date(), 30),
    endDate: addDays(new Date(), 60),
    status: "Active",
    successRate: 75,
    representativePhoneNumber: "555-0100",
  },
  {
    id: "camp_2",
    name: "New Product Launch",
    clientName: "Solutions Ltd",
    clientId: "client_2",
    tags: ["product launch", "marketing"],
    type: "Outbound",
    callsAttempted: 180,
    callsTargeted: 200,
    startDate: subDays(new Date(), 15),
    endDate: addDays(new Date(), 15),
    status: "Paused",
    successRate: 65,
    representativePhoneNumber: "555-0101",
  },
  {
    id: "camp_3",
    name: "Appointment Reminders - July",
    clientName: "Tech Ventures",
    clientId: "client_3",
    tags: ["reminders", "appointments"],
    type: "Reminder",
    callsAttempted: 95,
    callsTargeted: 100,
    startDate: subDays(new Date(), 45),
    endDate: subDays(new Date(), 15),
    status: "Completed",
    successRate: 92,
    representativePhoneNumber: "555-0102",
  },
  {
    id: "camp_4",
    name: "Customer Feedback Follow-up",
    clientName: "Global Connect",
    clientId: "client_4",
    tags: ["feedback", "customer service"],
    type: "Follow-Up",
    callsAttempted: 300,
    callsTargeted: 350,
    startDate: subDays(new Date(), 10),
    endDate: addDays(new Date(), 20),
    status: "Active",
    successRate: 88,
    representativePhoneNumber: "555-0103",
  },
  {
    id: "camp_5",
    name: "Abandoned Cart Recovery",
    clientName: "Innovate Corp",
    clientId: "client_1",
    tags: ["ecommerce", "sales", "recovery"],
    type: "Follow-Up",
    callsAttempted: 120,
    callsTargeted: 150,
    startDate: subDays(new Date(), 5),
    endDate: addDays(new Date(), 25),
    status: "Active",
    successRate: 55, // Lower success rate for this one
    representativePhoneNumber: "555-0104",
  },
];

const statusVariants: Record<CampaignStatus, string> = {
  Active: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
  Paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100",
  Completed: "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100",
};

const typeIcons: Record<CampaignType, React.ElementType> = {
    Outbound: Rocket,
    "Follow-Up": RefreshCcw,
    Reminder: BellRing,
};

const campaignStatusOptions: { value: CampaignStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "Active", label: "Active" },
  { value: "Paused", label: "Paused" },
  { value: "Completed", label: "Completed" },
];

const successRateOptions: { value: SuccessRateFilter; label: string }[] = [
  { value: "all", label: "All Success Rates" },
  { value: "low", label: "Low Success (<70%)" },
  { value: "high", label: "High Success (>=70%)" },
];

const sortOptions: { value: SortByType; label: string }[] = [
  { value: "latest", label: "Latest (Start Date)" },
  { value: "totalCalls", label: "Total Calls (Targeted)" },
  { value: "successRate", label: "Success Rate" },
];

export default function ManageCampaignsPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = React.useState<Campaign[]>(mockCampaigns);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<CampaignStatus | "all">("all");
  const [clientFilter, setClientFilter] = React.useState<string | "all">("all");
  const [dateRangeFilter, setDateRangeFilter] = React.useState<DateRange | undefined>(undefined);
  const [successRateFilter, setSuccessRateFilter] = React.useState<SuccessRateFilter>("all");
  const [sortBy, setSortBy] = React.useState<SortByType>("latest");

  const [statusComboboxOpen, setStatusComboboxOpen] = React.useState(false);
  const [clientComboboxOpen, setClientComboboxOpen] = React.useState(false);
  const [successRateComboboxOpen, setSuccessRateComboboxOpen] = React.useState(false);
  const [sortComboboxOpen, setSortComboboxOpen] = React.useState(false);
  const [isAddCampaignSheetOpen, setIsAddCampaignSheetOpen] = React.useState(false);

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const handleCampaignAction = (actionName: string, campaignId: string, campaignName: string) => {
    if (actionName === "Pause" || actionName === "Resume") {
        setCampaigns(prevCampaigns =>
            prevCampaigns.map(camp =>
              camp.id === campaignId
                ? { ...camp, status: camp.status === "Active" ? "Paused" : "Active" }
                : camp
            )
        );
    }
    toast({
      title: `${actionName} (Simulated)`,
      description: `Action performed on campaign: ${campaignName}.`,
    });
  };

  const handleAddCampaignSuccess = (newCampaignData: Omit<Campaign, 'id' | 'callsAttempted' | 'status' | 'successRate'>) => {
    const newCampaign: Campaign = {
      id: `camp_${Date.now()}`,
      ...newCampaignData,
      callsAttempted: 0,
      status: 'Active', 
      successRate: 0, 
    };
    setCampaigns(prev => [newCampaign, ...prev]);
    setIsAddCampaignSheetOpen(false);
    toast({
      title: "Campaign Added",
      description: `Campaign "${newCampaign.name}" has been successfully created.`,
    });
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const matchesSearch =
      campaign.name.toLowerCase().includes(lowerSearchTerm) ||
      campaign.clientName.toLowerCase().includes(lowerSearchTerm) ||
      (campaign.representativePhoneNumber && campaign.representativePhoneNumber.includes(searchTerm)) ||
      campaign.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm));

    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    const matchesClient = clientFilter === "all" || campaign.clientId === clientFilter;

    const matchesDate =
        !dateRangeFilter ||
        (!dateRangeFilter.from || campaign.startDate >= dateRangeFilter.from) &&
        (!dateRangeFilter.to || campaign.startDate <= addDays(dateRangeFilter.to,1));

    const matchesSuccessRate =
        successRateFilter === "all" ||
        (successRateFilter === "low" && campaign.successRate < 70) ||
        (successRateFilter === "high" && campaign.successRate >= 70);

    return matchesSearch && matchesStatus && matchesClient && matchesDate && matchesSuccessRate;
  });

  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    if (sortBy === "latest") return b.startDate.getTime() - a.startDate.getTime();
    if (sortBy === "totalCalls") return b.callsTargeted - a.callsTargeted;
    if (sortBy === "successRate") return b.successRate - a.successRate;
    return 0;
  });

  const totalPages = Math.ceil(sortedCampaigns.length / itemsPerPage);
  const paginatedCampaigns = sortedCampaigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    toast({
      title: `Exporting as ${format.toUpperCase()} (Simulated)`,
      description: `Preparing ${sortedCampaigns.length} campaign records for export.`,
    });
    console.log(`Exporting ${format.toUpperCase()} data (Campaigns):`, sortedCampaigns);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="border-b p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <div>
              <CardTitle className="text-3xl font-bold font-headline">Manage Campaigns</CardTitle>
              <CardDescription>Oversee and control all your calling campaigns.</CardDescription>
            </div>
            <Button size="lg" onClick={() => setIsAddCampaignSheetOpen(true)}>
              <PlusCircle className="mr-2 h-5 w-5" />
              New Campaign
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 items-end">
            <div className="relative lg:col-span-2 xl:col-span-2">
                <Label htmlFor="search-campaigns" className="text-xs font-medium text-muted-foreground">Search</Label>
                <Search className="absolute left-3 top-1/2 translate-y-[3px] h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-campaigns"
                  type="search"
                  placeholder="Name, Client, Phone, Tag..."
                  className="pl-10 w-full bg-background h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex flex-col">
              <Label htmlFor="status-filter" className="text-xs font-medium text-muted-foreground mb-1">Status</Label>
              <Popover open={statusComboboxOpen} onOpenChange={setStatusComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button id="status-filter" variant="outline" role="combobox" className="w-full justify-between h-9 text-sm">
                    {campaignStatusOptions.find(s => s.value === statusFilter)?.label || "Filter Status"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command><CommandInput placeholder="Search status..." /><CommandList><CommandEmpty>No status.</CommandEmpty><CommandGroup>
                    {campaignStatusOptions.map(opt => (<CommandItem key={opt.value} value={opt.label} onSelect={() => { setStatusFilter(opt.value); setStatusComboboxOpen(false); }}>
                      <Check className={cn("mr-2 h-4 w-4", statusFilter === opt.value ? "opacity-100" : "opacity-0")} />{opt.label}
                    </CommandItem>))}
                  </CommandGroup></CommandList></Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col">
              <Label htmlFor="client-filter" className="text-xs font-medium text-muted-foreground mb-1">Client</Label>
              <Popover open={clientComboboxOpen} onOpenChange={setClientComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button id="client-filter" variant="outline" role="combobox" className="w-full justify-between h-9 text-sm">
                    {clientFilter === "all" ? "All Clients" : mockClientsForFilter.find(c => c.id === clientFilter)?.name || "Filter Client"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command><CommandInput placeholder="Search client..." /><CommandList><CommandEmpty>No client.</CommandEmpty><CommandGroup>
                    <CommandItem value="All Clients" onSelect={() => { setClientFilter("all"); setClientComboboxOpen(false); }}>
                      <Check className={cn("mr-2 h-4 w-4", clientFilter === "all" ? "opacity-100" : "opacity-0")} />All Clients
                    </CommandItem>
                    {mockClientsForFilter.map(opt => (<CommandItem key={opt.id} value={opt.name} onSelect={() => { setClientFilter(opt.id); setClientComboboxOpen(false); }}>
                      <Check className={cn("mr-2 h-4 w-4", clientFilter === opt.id ? "opacity-100" : "opacity-0")} />{opt.name}
                    </CommandItem>))}
                  </CommandGroup></CommandList></Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col">
                <Label htmlFor="date-range-filter" className="text-xs font-medium text-muted-foreground mb-1">Date Created</Label>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button id="date-range-filter" variant={"outline"} className={cn("w-full justify-start text-left font-normal h-9 text-sm", !dateRangeFilter && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRangeFilter?.from ? (dateRangeFilter.to ? <>{format(dateRangeFilter.from, "LLL dd, y")} - {format(dateRangeFilter.to, "LLL dd, y")}</> : format(dateRangeFilter.from, "LLL dd, y")) : <span>Pick a date range</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar initialFocus mode="range" defaultMonth={dateRangeFilter?.from} selected={dateRangeFilter} onSelect={setDateRangeFilter} numberOfMonths={2}/>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="flex flex-col">
                <Label htmlFor="success-rate-filter" className="text-xs font-medium text-muted-foreground mb-1">Success Rate</Label>
                <Popover open={successRateComboboxOpen} onOpenChange={setSuccessRateComboboxOpen}>
                    <PopoverTrigger asChild>
                    <Button id="success-rate-filter" variant="outline" role="combobox" className="w-full justify-between h-9 text-sm">
                        {successRateOptions.find(s => s.value === successRateFilter)?.label || "Filter Success"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command><CommandInput placeholder="Search rate..." /><CommandList><CommandEmpty>No rate.</CommandEmpty><CommandGroup>
                        {successRateOptions.map(opt => (<CommandItem key={opt.value} value={opt.label} onSelect={() => { setSuccessRateFilter(opt.value); setSuccessRateComboboxOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", successRateFilter === opt.value ? "opacity-100" : "opacity-0")} />{opt.label}
                        </CommandItem>))}
                    </CommandGroup></CommandList></Command>
                    </PopoverContent>
                </Popover>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 pt-3 items-end">
            <div className="flex flex-col">
                <Label htmlFor="sort-by" className="text-xs font-medium text-muted-foreground mb-1">Sort By</Label>
                <Popover open={sortComboboxOpen} onOpenChange={setSortComboboxOpen}>
                    <PopoverTrigger asChild>
                    <Button id="sort-by" variant="outline" role="combobox" className="w-full justify-between h-9 text-sm">
                        <ArrowUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        {sortOptions.find(s => s.value === sortBy)?.label || "Sort by"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command><CommandInput placeholder="Search sort..." /><CommandList><CommandEmpty>No sort option.</CommandEmpty><CommandGroup>
                        {sortOptions.map(opt => (<CommandItem key={opt.value} value={opt.label} onSelect={() => { setSortBy(opt.value); setSortComboboxOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", sortBy === opt.value ? "opacity-100" : "opacity-0")} />{opt.label}
                        </CommandItem>))}
                    </CommandGroup></CommandList></Command>
                    </PopoverContent>
                </Popover>
            </div>
            <div className="flex flex-col">
                <Label htmlFor="export-data" className="text-xs font-medium text-muted-foreground mb-1 opacity-0 sm:hidden">.</Label> {}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button id="export-data" variant="outline" className="w-full h-9 text-sm">
                        <FileDown className="mr-2 h-4 w-4" /> Export
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Export Options</DropdownMenuLabel><DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport("csv")}>Export as CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("excel")}>Export as Excel</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("pdf")}>Export as PDF</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Client Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Calls (Attempted/Targeted)</TableHead>
                <TableHead>Dates (Start - End)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCampaigns.length > 0 ? paginatedCampaigns.map((campaign) => {
                const TypeIcon = typeIcons[campaign.type];
                return (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{campaign.clientName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                       <TypeIcon className="h-3.5 w-3.5"/> {campaign.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{`${campaign.callsAttempted} / ${campaign.callsTargeted}`}</TableCell>
                  <TableCell>{`${format(campaign.startDate, "MMM dd, yyyy")} - ${format(campaign.endDate, "MMM dd, yyyy")}`}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${statusVariants[campaign.status]}`}>{campaign.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className={cn(campaign.successRate >= 70 ? "text-green-600" : "text-red-600")}>
                        {campaign.successRate}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => toast({title: "View Campaign", description: "Redirect to campaign details page (to be implemented)."})}>
                            <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast({title: "Monitor Campaign", description: "Redirect to live monitoring page (to be implemented)."})}>
                            <PlayCircle className="mr-2 h-4 w-4" /> Monitor {}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {campaign.status === "Active" && (
                            <DropdownMenuItem className="text-yellow-600 focus:text-yellow-700" onClick={() => handleCampaignAction("Pause", campaign.id, campaign.name)}>
                                <PauseCircle className="mr-2 h-4 w-4" /> Pause
                            </DropdownMenuItem>
                        )}
                        {campaign.status === "Paused" && (
                            <DropdownMenuItem className="text-green-600 focus:text-green-700" onClick={() => handleCampaignAction("Resume", campaign.id, campaign.name)}>
                                <PlayCircle className="mr-2 h-4 w-4" /> Resume
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleCampaignAction("Delete", campaign.id, campaign.name)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )}) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No campaigns found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
           <div className="text-xs text-muted-foreground">
             Showing <strong>{paginatedCampaigns.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong>
             -<strong>{Math.min(currentPage * itemsPerPage, sortedCampaigns.length)}</strong> of <strong>{sortedCampaigns.length}</strong> campaigns
           </div>
           <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
           </div>
        </CardFooter>
      </Card>

      <Sheet open={isAddCampaignSheetOpen} onOpenChange={setIsAddCampaignSheetOpen}>
        <SheetContent className="sm:max-w-lg w-full flex flex-col" side="right">
            <SheetHeader>
                <SheetTitle>Create New Campaign</SheetTitle>
                <SheetDescription>
                    Fill in the details below to launch a new calling campaign.
                </SheetDescription>
            </SheetHeader>
            <AddCampaignForm 
                clients={mockClientsForFilter} 
                onSuccess={handleAddCampaignSuccess} 
                onCancel={() => setIsAddCampaignSheetOpen(false)}
            />
        </SheetContent>
      </Sheet>
    </div>
  );
}
