
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
import { CampaignDetailsView } from "@/components/campaigns/campaign-details-view"; 
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
  PlusCircle,
  X,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/cn";
import { format, addDays, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Label } from "@/components/ui/label";
import type { Metadata } from 'next';
import { urls } from '@/lib/config/urls';

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
  agentName?: string;
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

// Clients loaded from backend
type ClientOption = { id: string; name: string };

const mockCampaigns: Campaign[] = [];

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
  const [clientsOptions, setClientsOptions] = React.useState<ClientOption[]>([]);
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
  const [isViewCampaignSheetOpen, setIsViewCampaignSheetOpen] = React.useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string | null>(null);

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const [workspaceBatches, setWorkspaceBatches] = React.useState<any>(null);
  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch(urls.backend.campaigns.list());
      const json = await res.json();
      console.log('[ManageCampaigns] API Response:', json);
      console.log('[ManageCampaigns] First batch local data:', json.batch_calls?.[0]?.local);
      setWorkspaceBatches(json);
    } catch (err) {
      console.error('[ManageCampaigns] API Error:', err);
    }
  }, []);
  React.useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, [refresh]);

  // Load clients from backend DB
  React.useEffect(() => {
    (async () => {
      try {
        let rows: any[] = [];
        try {
          const res1 = await fetch(urls.backend.api('/clients'), { cache: 'no-store' });
          if (res1.ok) {
            const data1 = await res1.json();
            if (Array.isArray(data1?.data)) rows = data1.data;
            else if (Array.isArray(data1?.clients)) rows = data1.clients;
          }
        } catch {}
        if (!Array.isArray(rows) || rows.length === 0) {
          try {
            const res2 = await fetch('/api/clients', { cache: 'no-store' });
            if (res2.ok) {
              const data2 = await res2.json();
              if (Array.isArray(data2?.data)) rows = data2.data;
              else if (Array.isArray(data2?.clients)) rows = data2.clients;
              else if (Array.isArray(data2)) rows = data2;
            }
          } catch {}
        }
        const opts = (rows || []).map((c: any) => ({ id: String(c.id), name: c.companyName || c.name || c.clientName || `Client ${c.id}` }));
        setClientsOptions(opts);
      } catch {}
    })();
  }, []);

  React.useEffect(() => {
    if (!workspaceBatches) return;
    const list = Array.isArray(workspaceBatches?.batch_calls)
      ? workspaceBatches.batch_calls
      : Array.isArray(workspaceBatches?.items)
      ? workspaceBatches.items
      : Array.isArray(workspaceBatches)
      ? workspaceBatches
      : [];
    if (!Array.isArray(list)) return;
    // Map ElevenLabs batch items to Campaign UI shape, using local data when available
    const mapped: Campaign[] = list.map((b: any) => {
      const total = Number(b.total_calls_scheduled || b.total_calls || 0);
      const attempted = Number(b.total_calls_dispatched || 0);
      const created = b.created_at_unix ? new Date(b.created_at_unix * 1000) : (b.created_at ? new Date(b.created_at) : new Date());
      const end = b.last_updated_at_unix ? new Date(b.last_updated_at_unix * 1000) : addDays(created, 30);
      const statusLower = (b.status || '').toString().toLowerCase();
      const status: CampaignStatus = statusLower.includes('cancel') ? 'Paused' : statusLower.includes('complete') ? 'Completed' : 'Active';
      
      // Use local database data if available, otherwise fall back to ElevenLabs data
      const localData = b.local;
      console.log(`[ManageCampaigns] Mapping campaign ${b.name}:`, {
        localData,
        clientName: localData?.clientName,
        agentName: localData?.agentName,
        elevenLabsClientName: b.client_name,
        elevenLabsAgentName: b.agent_name
      });
      
      return {
        id: String(b.id || b.batch_id || b.batchId || b.name || Math.random()),
        name: localData?.name || b.name || 'Batch Campaign',
        clientName: localData?.clientName || b.client_name || (localData ? 'Workspace' : ''), // Empty for ElevenLabs-only data
        clientId: localData?.clientId || 'workspace',
        agentName: localData?.agentName || b.agent_name || undefined, // Use ElevenLabs agent_name as fallback
        tags: [],
        type: 'Outbound' as CampaignType,
        callsAttempted: attempted,
        callsTargeted: total,
        startDate: created,
        endDate: end,
        status,
        successRate: total > 0 ? Math.round((attempted / total) * 100) : 0,
        representativePhoneNumber: undefined,
      };
    });
    setCampaigns(mapped);
  }, [workspaceBatches]);

  async function submitCampaignToBackend(payload: Omit<Campaign, 'id' | 'callsAttempted' | 'status' | 'successRate'>) {
    const body = {
      name: payload.name,
      target_count: payload.callsTargeted,
      start_date: payload.startDate,
      end_date: payload.endDate,
      // Optionally include more fields (agent_id, dataset, etc.) as needed
    };
    await fetch(urls.backend.campaigns.submit(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    await refresh();
  }

  const handleCampaignAction = async (actionName: string, campaignId: string, campaignName: string) => {
    try {
      if (actionName === 'Pause') {
        await fetch(urls.backend.campaigns.pause(campaignId), { method: 'POST' });
        await refresh();
        toast({ title: 'Paused', description: `Campaign "${campaignName}" paused.` });
        return;
      }
      if (actionName === 'Resume') {
        await fetch(urls.backend.campaigns.resume(campaignId), { method: 'POST' });
        await refresh();
        toast({ title: 'Resumed', description: `Campaign "${campaignName}" resumed.` });
        return;
      }
      if (actionName === 'Cancel') {
        const response = await fetch(urls.backend.campaigns.cancel(campaignId), { method: 'POST' });
        const result = await response.json();
        if (result.success) {
          await refresh();
          toast({ title: 'Cancelled', description: `Campaign "${campaignName}" cancelled successfully.` });
        } else {
          toast({ title: 'Cancel Failed', description: result.error || 'Failed to cancel campaign.' });
        }
        return;
      }
      if (actionName === 'Retry') {
        const response = await fetch(urls.backend.campaigns.retry(campaignId), { method: 'POST' });
        const result = await response.json();
        if (result.success) {
          await refresh();
          toast({ title: 'Retry Initiated', description: `Campaign "${campaignName}" retry initiated successfully.` });
        } else {
          toast({ title: 'Retry Failed', description: result.error || 'Failed to retry campaign.' });
        }
        return;
      }
      if (actionName === 'Delete') {
        await fetch(urls.backend.campaigns.delete(campaignId), { method: 'DELETE' });
        await refresh();
        toast({ title: 'Deleted', description: `Campaign "${campaignName}" cancelled.` });
        return;
      }
      toast({ title: actionName, description: `Action on "${campaignName}" executed.` });
    } catch {
      toast({ title: 'Action failed', description: 'Please try again later.' });
    }
  };

  const handleAddCampaignSuccess = async (newCampaignData: Omit<Campaign, 'id' | 'callsAttempted' | 'status' | 'successRate'>) => {
    setIsAddCampaignSheetOpen(false);
    toast({ title: 'Campaign Added', description: `Campaign "${newCampaignData.name}" has been submitted.` });
    await refresh();
  };

  const handleViewCampaign = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setIsViewCampaignSheetOpen(true);
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
                    {clientFilter === "all" ? "All Clients" : clientsOptions.find(c => c.id === clientFilter)?.name || "Filter Client"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command><CommandInput placeholder="Search client..." /><CommandList><CommandEmpty>No client.</CommandEmpty><CommandGroup>
                    <CommandItem value="All Clients" onSelect={() => { setClientFilter("all"); setClientComboboxOpen(false); }}>
                      <Check className={cn("mr-2 h-4 w-4", clientFilter === "all" ? "opacity-100" : "opacity-0")} />All Clients
                    </CommandItem>
                    {clientsOptions.map(opt => (<CommandItem key={opt.id} value={opt.name} onSelect={() => { setClientFilter(opt.id); setClientComboboxOpen(false); }}>
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
                <TableHead>Agent Name</TableHead>
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
                  <TableCell>
                    {campaign.clientName && campaign.clientName.trim() !== '' ? (
                      <span className="font-medium">{campaign.clientName}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {campaign.agentName ? (
                      <span className="font-medium">{campaign.agentName}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
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
                        <DropdownMenuItem onClick={() => handleViewCampaign(campaign.id)}>
                            <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          window.location.href = `/campaigns/monitor-live?campaignId=${encodeURIComponent(campaign.id)}`;
                        }}>
                            <PlayCircle className="mr-2 h-4 w-4" /> Monitor
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
                        {campaign.status === "Active" && (
                            <DropdownMenuItem className="text-red-600 focus:text-red-700" onClick={() => handleCampaignAction("Cancel", campaign.id, campaign.name)}>
                                <X className="mr-2 h-4 w-4" /> Cancel
                            </DropdownMenuItem>
                        )}
                        {(campaign.status === "Completed" || campaign.status === "Paused") && (
                            <DropdownMenuItem className="text-blue-600 focus:text-blue-700" onClick={() => handleCampaignAction("Retry", campaign.id, campaign.name)}>
                                <RotateCcw className="mr-2 h-4 w-4" /> Retry
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
                clients={clientsOptions} 
                onSuccess={handleAddCampaignSuccess} 
                onCancel={() => setIsAddCampaignSheetOpen(false)}
            />
        </SheetContent>
      </Sheet>

      <Sheet open={isViewCampaignSheetOpen} onOpenChange={setIsViewCampaignSheetOpen}>
        <SheetContent className="sm:max-w-2xl w-full flex flex-col" side="right">
          {selectedCampaignId && (
            <CampaignDetailsView 
              campaignId={selectedCampaignId}
              onClose={() => {
                setIsViewCampaignSheetOpen(false);
                setSelectedCampaignId(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
