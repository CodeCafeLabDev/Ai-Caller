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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
import {
  Search,
  PlusCircle,
  ListFilter,
  MoreHorizontal,
  Eye,
  Edit2,
  UserX,
  UserCheck,
  ArrowUpDown,
  FileText,
  Check,
  ChevronsUpDown,
  FileDown,
  UserCog, // Added UserCog icon
} from "lucide-react";
import { AddClientForm } from "@/components/clients/add-client-form";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/use-toast"; 
import type { AddClientFormValues } from "@/components/clients/add-client-form";
import { Switch } from "@/components/ui/switch";
import { exportAsCSV, exportAsExcel, exportAsPDF } from '@/lib/exportUtils';
import { useSearchParams, useRouter } from "next/navigation";
import { api } from '@/lib/apiConfig';
import { Suspense } from "react";

// Removed: export const metadata: Metadata = { ... };


type Client = {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  clientId: string;
  status: "Active" | "Suspended" | "Trial";
  plans: string[];
  totalCallsMade: number;
  monthlyCallsMade: number;
  monthlyCallLimit: number;
  joinedDate: string;
  avatarUrl?: string;
};

const statusVariants: Record<Client["status"], string> = {
  Active: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
  Suspended: "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100",
  Trial: "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100",
};

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "trial", label: "Trial" },
];

const sortOptions = [
  { value: "joinedDateDesc", label: "Newest First" },
  { value: "joinedDateAsc", label: "Oldest First" },
  { value: "nameAsc", label: "Name (A-Z)" },
  { value: "nameDesc", label: "Name (Z-A)" },
];

function AllClientsListPageInner() {
  const { toast } = useToast(); 
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [planFilter, setPlanFilter] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("joinedDateDesc");
  const [isAddClientSheetOpen, setIsAddClientSheetOpen] = React.useState(false);
  const [isEditClientSheetOpen, setIsEditClientSheetOpen] = React.useState(false);
  const [editingClient, setEditingClient] = React.useState<any>(null);
  const router = useRouter();

  const [statusComboboxOpen, setStatusComboboxOpen] = React.useState(false);
  const [planComboboxOpen, setPlanComboboxOpen] = React.useState(false);
  const [sortComboboxOpen, setSortComboboxOpen] = React.useState(false);

  const [clients, setClients] = React.useState<Client[]>([]);
  const [plans, setPlans] = React.useState<{ id: number; name: string }[]>([]);
  const [managePlansForClient, setManagePlansForClient] = React.useState<null | { id: string; name: string }>(null);
  const [assignedPlans, setAssignedPlans] = React.useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = React.useState<Date>(new Date());

  // Fetch clients from API and update state
  const fetchClients = React.useCallback(() => {
    api.getClients()
      .then(res => res.json())
      .then(async data => {
        if (data.success) {
          // Map backend fields to frontend Client type and ensure unique IDs
          const processedData: Client[] = data.data
            .filter((c: any) => c.id != null && c.id !== undefined)
            .map((c: any, index: number) => ({
              id: `${String(c.id)}-${index}`,
              name: c.companyName,
              contactPerson: c.contactPersonName,
              email: c.companyEmail,
              phone: c.phoneNumber,
              clientId: String(c.id),
              status: c.status || "Active",
              plans: String(c.planNames || "")
                .split(',')
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0),
              totalCallsMade: c.totalCallsMade || 0,
              monthlyCallsMade: c.monthlyCallsMade || 0,
              monthlyCallLimit: c.monthlyCallLimit || 0,
              joinedDate: c.created_at || new Date().toISOString(),
              avatarUrl: "",
            }));

          // Enhance monthlyCallsMade with real-time ElevenLabs usage
          const enhanced: Client[] = await Promise.all(processedData.map(async (cl: Client) => {
            try {
              const r = await api.getElevenLabsUsage(cl.clientId);
              const j = await r.json();
              if (j?.success && j?.data && typeof j.data.monthlyCalls === 'number') {
                return { ...cl, monthlyCallsMade: j.data.monthlyCalls };
              }
            } catch {}
            return cl;
          }));

          setClients(enhanced);
          setLastUpdated(new Date());
        } else {
          toast({ title: 'Error', description: 'Failed to fetch clients', variant: 'destructive' });
        }
      });
  }, [toast]);

  // Fetch only ElevenLabs usage to update the Usage column in near real-time
  const fetchUsageData = React.useCallback(async () => {
    try {
      const updated = await Promise.all(clients.map(async (cl) => {
        try {
          const r = await api.getElevenLabsUsage(cl.clientId);
          const j = await r.json();
          if (j?.success && j?.data && typeof j.data.monthlyCalls === 'number') {
            return { ...cl, monthlyCallsMade: j.data.monthlyCalls };
          }
        } catch {}
        return cl;
      }));
      setClients(updated);
      setLastUpdated(new Date());
    } catch {}
  }, [clients]);

  React.useEffect(() => {
    fetchClients();
    // Fetch plans from API
    api.getPlans()
      .then(res => res.json())
      .then(data => {
        if (data.success) setPlans(data.data.map((p: any) => ({ id: p.id, name: p.name })));
      });
    
    // Near real-time usage refresh every 10 seconds
    const usageIntervalId = setInterval(() => {
      fetchUsageData();
    }, 10000);

    // Full client refresh every 30 seconds (keeps plan/limit/etc. fresh)
    const fullRefreshIntervalId = setInterval(() => {
      fetchClients();
    }, 30000);

    return () => {
      clearInterval(usageIntervalId);
      clearInterval(fullRefreshIntervalId);
    };
  }, [toast, fetchClients, fetchUsageData]);

  // Load assigned plans when manage sheet is open
  React.useEffect(() => {
    if (managePlansForClient) {
      api.getAssignedPlansForClient(managePlansForClient.id)
        .then(res => res.json())
        .then(data => setAssignedPlans(Array.isArray(data.data) ? data.data : []));
    } else {
      setAssignedPlans([]);
    }
  }, [managePlansForClient]);

  React.useEffect(() => {
    if (searchParams.get('addClient') === '1') {
      setIsAddClientSheetOpen(true);
    }
  }, [searchParams]);

  // Open Edit Sheet if ?editClient=ID is in the URL
  React.useEffect(() => {
    const editId = searchParams.get("editClient");
    if (editId) {
      api.getClient(editId)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setEditingClient(data.data);
            setIsEditClientSheetOpen(true);
          }
        });
    } else {
      setIsEditClientSheetOpen(false);
      setEditingClient(null);
    }
  }, [searchParams]);

  const handleEditClient = (client: any) => {
    setEditingClient(client);
    setIsEditClientSheetOpen(true);
    router.push(`/clients/list?editClient=${client.clientId}`);
  };

  const handleEditClientSuccess = async (formData: any) => {
    if (!editingClient) return;
    // Remove aggregated/computed fields that don't exist in DB
    const blacklist = ['planName','planNames','totalMonthlyLimit','monthlyCallLimit','monthlyCallsMade','totalCallsMade','joinedDate','created_at','updated_at'];
    const formToSend: any = Object.fromEntries(Object.entries(formData).filter(([k]) => !blacklist.includes(String(k))));
    const res = await api.updateClient(editingClient.clientId, formToSend);
    const data = await res.json();
    if (data.success) {
      setIsEditClientSheetOpen(false);
      setEditingClient(null);
      fetchClients();
      toast({ title: "Client updated successfully!" });
      router.push("/clients/list");
    } else {
      toast({ title: "Error", description: data.message || "Failed to update client", variant: "destructive" });
    }
  };

  // Plan filter options are now dynamic
  const dynamicPlanOptions = [
    { value: "all", label: "All Plans" },
    ...Array.from(new Set(plans.map((p) => p.name)))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name.toLowerCase(), label: name }))
  ];

  const filteredClients = clients.filter((client) => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (
      (client.name.toLowerCase().includes(lowerSearchTerm) ||
        client.email.toLowerCase().includes(lowerSearchTerm) ||
        client.clientId.toLowerCase().includes(lowerSearchTerm) || 
        client.contactPerson.toLowerCase().includes(lowerSearchTerm) ||
        client.phone.toLowerCase().includes(lowerSearchTerm)) &&
      (statusFilter === "all" || client.status.toLowerCase() === statusFilter) &&
      (planFilter === "all" || client.plans.some(p => p.toLowerCase() === planFilter))
    );
  });

  const sortedClients = [...filteredClients].sort((a, b) => {
    if (sortBy === "nameAsc") return a.name.localeCompare(b.name);
    if (sortBy === "nameDesc") return b.name.localeCompare(a.name);
    if (sortBy === "joinedDateAsc") return new Date(a.joinedDate).getTime() - new Date(b.joinedDate).getTime();
    if (sortBy === "joinedDateDesc") return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
    return 0;
  });
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedClients.length / itemsPerPage);
  const paginatedClients = sortedClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAddClientSuccess = async (formData: AddClientFormValues) => {
    // 1) Enforce unique email (case-insensitive) before creating
    const existingRes = await api.getClients();
    const existingJson = await existingRes.json();
    if (existingJson?.success && Array.isArray(existingJson.data)) {
      const emailLower = (formData.companyEmail || '').trim().toLowerCase();
      const exists = existingJson.data.some((c: any) => String(c.companyEmail || '').trim().toLowerCase() === emailLower);
      if (exists) {
        toast({ title: "Email already in use", description: "A client with this email already exists.", variant: 'destructive' });
        return;
      }
    }

    // 2) Create client
    const response = await api.createClient(formData);
    const data = await response.json();
    if (data.success) {
      setIsAddClientSheetOpen(false);
      // Refresh client list
      fetchClients();
      toast({ title: "Client Added", description: "The new client has been successfully added." });
      // 3) Auto-send welcome email (backend recommended). For now, call an email endpoint if available
      try {
        if (formData.autoSendLoginEmail) {
          await fetch(`/api/clients/${encodeURIComponent(String(data.data?.id || ''))}/send-welcome-email`, { method: 'POST' });
        }
      } catch {}
    } else {
      toast({ title: "Error", description: data.message || "Failed to add client", variant: "destructive" });
    }
  };

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    if (sortedClients.length === 0) return;
    if (format === "csv") exportAsCSV(sortedClients, 'clients.csv');
    else if (format === "excel") exportAsExcel(sortedClients, 'clients.xlsx');
    else if (format === "pdf") exportAsPDF(sortedClients, 'clients.pdf');
    toast({
      title: `Exported as ${format.toUpperCase()}`,
      description: `Downloaded ${sortedClients.length} client records.`,
    });
  };

  const handleStatusChange = async (clientId: string, newStatus: 'Active' | 'Suspended') => {
    try {
      // 1. Fetch the full client data
      const resGet = await api.getClient(clientId);
      const dataGet = await resGet.json();
      if (!dataGet.success) {
        toast({ title: 'Error', description: 'Failed to fetch client data', variant: 'destructive' });
        return;
      }
      // 2. Remove planName (not a DB column)
      const { planName, ...clientData } = dataGet.data;
      // 3. Update status
      clientData.status = newStatus;
      // 4. Send full object in PUT request
      const res = await api.updateClient(clientId, clientData);
      const data = await res.json();
      if (data.success) {
        toast({ title: `Client ${newStatus === 'Suspended' ? 'suspended' : 'activated'} successfully!` });
        fetchClients();
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to update status', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline">Manage Clients</h1>
            <p className="text-muted-foreground">
              Manage and view all client accounts. 
              <span className="ml-2 text-xs text-blue-600">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </p>
        </div>
        <div className="flex gap-2">
        <Sheet open={isAddClientSheetOpen} onOpenChange={setIsAddClientSheetOpen}>
          <SheetTrigger asChild>
            <Button size="lg" onClick={() => setIsAddClientSheetOpen(true)}>
              <PlusCircle className="mr-2 h-5 w-5" />
              Add New Client
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-sm w-full flex flex-col" side="right">
            <SheetHeader>
              <SheetTitle>Add New Client</SheetTitle>
              <SheetDescription>
                Fill in the details below to add a new client to the system.
              </SheetDescription>
            </SheetHeader>
            <AddClientForm
              onSuccess={handleAddClientSuccess}
              onCancel={() => setIsAddClientSheetOpen(false)}
            />
          </SheetContent>
        </Sheet>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b p-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative flex-grow w-full md:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                  type="search"
                  placeholder="Search by name, email, ID..."
                  className="pl-10 w-full bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <div className="flex gap-2 flex-wrap w-full md:w-auto justify-start items-center"> 
                  {/* Status Filter Combobox */}
                  <Popover open={statusComboboxOpen} onOpenChange={setStatusComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={statusComboboxOpen}
                        className="w-full sm:w-auto md:w-[180px] justify-between"
                      >
                        <ListFilter className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        {statusOptions.find(s => s.value === statusFilter)?.label || "Filter by Status"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Search status..." />
                        <CommandList>
                          <CommandEmpty>No status found.</CommandEmpty>
                          <CommandGroup>
                            {statusOptions.map(option => (
                              <CommandItem
                                key={option.value}
                                value={option.label}
                                onSelect={() => {
                                  setStatusFilter(option.value);
                                  setStatusComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    statusFilter === option.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {option.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {/* Plan Filter Combobox */}
                  <Popover open={planComboboxOpen} onOpenChange={setPlanComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={planComboboxOpen}
                        className="w-full sm:w-auto md:w-[180px] justify-between"
                      >
                        <FileText className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        {dynamicPlanOptions.find(p => p.value === planFilter)?.label || "Filter by Plan"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Search plan..." />
                        <CommandList>
                          <CommandEmpty>No plan found.</CommandEmpty>
                          <CommandGroup>
                            {dynamicPlanOptions.map(option => (
                              <CommandItem
                                key={option.value}
                                value={option.label}
                                onSelect={() => {
                                  setPlanFilter(option.value);
                                  setPlanComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    planFilter === option.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {option.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Sort By Combobox */}
                  <Popover open={sortComboboxOpen} onOpenChange={setSortComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={sortComboboxOpen}
                        className="w-full sm:w-auto md:w-[180px] justify-between"
                      >
                        <ArrowUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        {sortOptions.find(s => s.value === sortBy)?.label || "Sort by"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Search sort option..." />
                        <CommandList>
                          <CommandEmpty>No sort option found.</CommandEmpty>
                          <CommandGroup>
                            {sortOptions.map(option => (
                              <CommandItem
                                key={option.value}
                                value={option.label}
                                onSelect={() => {
                                  setSortBy(option.value);
                                  setSortComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    sortBy === option.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {option.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {/* Export Button */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-auto">
                        <FileDown className="mr-2 h-4 w-4" /> Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleExport("csv")}>
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("excel")}>
                        Export as Excel (XLSX)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("pdf")}>
                        Export as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[200px]">Client</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <span>Usage</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Real-time data"></div>
                  </div>
                </TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedClients.map((client) => (
                <TableRow key={client.id}>
                    <TableCell>
                      <Link href={`/clients/details-usage?clientId=${client.clientId}`} className="hover:underline">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                            <AvatarImage src={client.avatarUrl} alt={client.name} data-ai-hint="company logo" />
                            <AvatarFallback>
                                {client.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{client.name}</div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>{client.contactPerson}</TableCell>
                    <TableCell>
                        <div>{client.email}</div>
                        <div className="text-xs text-muted-foreground">{client.phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusVariants[client.status]}`}>{client.status}</Badge>
                        <Switch
                          checked={client.status === "Active"}
                          onCheckedChange={() => handleStatusChange(client.clientId, client.status === "Active" ? "Suspended" : "Active")}
                          aria-label="Toggle client status"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.plans && client.plans.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {client.plans.map((planName, idx) => (
                            <Badge key={`${client.clientId}-plan-${idx}`} variant="secondary" className="text-xs">
                              {planName}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">No plan</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{client.monthlyCallsMade}</span>
                          <span className="text-muted-foreground">/ {client.monthlyCallLimit}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                            style={{ 
                              width: `${Math.min((client.monthlyCallsMade / client.monthlyCallLimit) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {client.monthlyCallLimit > 0 ? 
                            `${Math.round((client.monthlyCallsMade / client.monthlyCallLimit) * 100)}% used` : 
                            'Unlimited'
                          }
                        </div>
                        <div className="text-xs text-gray-500">
                          Total: {client.totalCallsMade}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(client.joinedDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/clients/details-usage?clientId=${client.clientId}`}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClient(client)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit Client
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setManagePlansForClient({ id: client.clientId, name: client.name })}>
                          <UserCog className="mr-2 h-4 w-4" /> Manage Plans
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/client-admin/dashboard`}> {}
                                <UserCog className="mr-2 h-4 w-4" /> Admin Panel
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {client.status === "Active" && (
                            <DropdownMenuItem className="text-yellow-600 focus:bg-yellow-50 focus:text-yellow-700" onClick={() => handleStatusChange(client.clientId, 'Suspended')}>
                            <UserX className="mr-2 h-4 w-4" /> Suspend
                            </DropdownMenuItem>
                        )}
                        {client.status === "Suspended" && (
                            <DropdownMenuItem className="text-green-600 focus:bg-green-50 focus:text-green-700" onClick={() => handleStatusChange(client.clientId, 'Active')}>
                            <UserCheck className="mr-2 h-4 w-4" /> Activate
                            </DropdownMenuItem>
                        )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
            {paginatedClients.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                    No clients found. Try adjusting your search or filters.
                </div>
            )}
        </CardContent>
        <CardFooter className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
           <div className="text-xs text-muted-foreground">
             Showing <strong>{paginatedClients.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong>
             -<strong>{Math.min(currentPage * itemsPerPage, sortedClients.length)}</strong> of <strong>{sortedClients.length}</strong> clients
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

      {/* Manage Plans Sheet */}
      <Sheet open={!!managePlansForClient} onOpenChange={(open) => {
        if (!open) setManagePlansForClient(null);
      }}>
        <SheetContent side="right" className="sm:max-w-sm w-full flex flex-col">
          <SheetHeader>
            <SheetTitle>Manage Plans{managePlansForClient ? ` – ${managePlansForClient.name}` : ''}</SheetTitle>
            <SheetDescription>View and remove assigned plans for this client.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {assignedPlans.length === 0 && (
              <div className="text-sm text-muted-foreground">No plans assigned.</div>
            )}
            {assignedPlans.map((ap) => (
              <div key={ap.assignmentId} className="flex items-center justify-between border rounded-md p-3">
                <div className="space-y-0.5">
                  <div className="font-medium">{ap.planName || 'Plan'}</div>
                  <div className="text-xs text-muted-foreground">
                    {ap.monthlyLimit ? `${ap.monthlyLimit} calls/mo` : 'Unlimited'} {ap.isActive ? '(Active)' : '(Inactive)'}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    await api.deleteAssignedPlan(String(ap.assignmentId));
                    // Refresh both assigned plans and clients list
                    if (managePlansForClient) {
                      const r = await api.getAssignedPlansForClient(managePlansForClient.id);
                      const j = await r.json();
                      setAssignedPlans(Array.isArray(j.data) ? j.data : []);
                    }
                    fetchClients();
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isEditClientSheetOpen} onOpenChange={open => {
        setIsEditClientSheetOpen(open);
        if (!open) router.push("/clients/list");
      }}>
        <SheetContent side="right" className="sm:max-w-sm w-full flex flex-col">
          <SheetHeader>
            <SheetTitle>Edit Client</SheetTitle>
            <SheetDescription>
              Update the details below to edit the client.
            </SheetDescription>
          </SheetHeader>
          {editingClient && (
            <form onSubmit={async (e) => {
              e.preventDefault();
              await handleEditClientSuccess(editingClient);
            }} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Company Name</label>
                <Input name="companyName" value={editingClient.companyName || ""} onChange={e => setEditingClient({ ...editingClient, companyName: e.target.value })} required />
              </div>
              <div>
                <label className="block mb-1 font-medium">Company Email</label>
                <Input name="companyEmail" type="email" value={editingClient.companyEmail || ""} onChange={e => setEditingClient({ ...editingClient, companyEmail: e.target.value })} required />
              </div>
              <div>
                <label className="block mb-1 font-medium">Phone Number</label>
                <Input name="phoneNumber" value={editingClient.phoneNumber || ""} onChange={e => setEditingClient({ ...editingClient, phoneNumber: e.target.value })} required />
              </div>
              <div>
                <label className="block mb-1 font-medium">Address</label>
                <Input name="address" value={editingClient.address || ""} onChange={e => setEditingClient({ ...editingClient, address: e.target.value })} />
              </div>
              <div>
                <label className="block mb-1 font-medium">Contact Person Name</label>
                <Input name="contactPersonName" value={editingClient.contactPersonName || ""} onChange={e => setEditingClient({ ...editingClient, contactPersonName: e.target.value })} required />
              </div>
              <div>
                <label className="block mb-1 font-medium">Admin Password</label>
                <Input name="adminPassword" type="password" value={editingClient.adminPassword || ""} onChange={e => setEditingClient({ ...editingClient, adminPassword: e.target.value })} required autoComplete="new-password" />
              </div>
              <div className="flex gap-4 mt-6">
                <Button type="submit">Save Changes</Button>
                <Button type="button" variant="outline" onClick={() => { setIsEditClientSheetOpen(false); router.push("/clients/list"); }}>Cancel</Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function AllClientsListPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AllClientsListPageInner />
    </Suspense>
  );
}

