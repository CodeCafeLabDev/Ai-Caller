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
import { useSearchParams } from "next/navigation";
import { api } from '@/lib/apiConfig';

// Removed: export const metadata: Metadata = { ... };


type Client = {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  clientId: string;
  status: "Active" | "Suspended" | "Trial";
  plan: string;
  totalCallsMade: number;
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


export default function AllClientsListPage() {
  const { toast } = useToast(); 
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [planFilter, setPlanFilter] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("joinedDateDesc");
  const [isAddClientSheetOpen, setIsAddClientSheetOpen] = React.useState(false);

  const [statusComboboxOpen, setStatusComboboxOpen] = React.useState(false);
  const [planComboboxOpen, setPlanComboboxOpen] = React.useState(false);
  const [sortComboboxOpen, setSortComboboxOpen] = React.useState(false);

  const [clients, setClients] = React.useState<Client[]>([]);
  const [plans, setPlans] = React.useState<{ id: number; name: string }[]>([]);

  // Fetch clients from API and update state
  const fetchClients = React.useCallback(() => {
    api.getClients()
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Map backend fields to frontend Client type
          setClients(
            data.data.map((c: any) => ({
              id: c.id,
              name: c.companyName,
              contactPerson: c.contactPersonName,
              email: c.companyEmail,
              phone: c.phoneNumber,
              clientId: String(c.id), // Ensure clientId is always a string
              status: c.status || "Active", // Default or map from DB if you have
              plan: c.planName || "", // planName from join
              totalCallsMade: c.totalCallsMade || 0, // If you have this in DB, else 0
              monthlyCallLimit: c.monthlyCallLimit || 0, // If you have this in DB, else 0
              joinedDate: c.created_at || new Date().toISOString(),
              avatarUrl: "", // If you have an avatar field, else empty
            }))
          );
        } else {
          toast({ title: 'Error', description: 'Failed to fetch clients', variant: 'destructive' });
        }
      });
  }, [toast]);

  React.useEffect(() => {
    fetchClients();
    // Fetch plans from API
    api.getPlans()
      .then(res => res.json())
      .then(data => {
        if (data.success) setPlans(data.data.map((p: any) => ({ id: p.id, name: p.name })));
      });
  }, [toast, fetchClients]);

  React.useEffect(() => {
    if (searchParams.get('addClient') === '1') {
      setIsAddClientSheetOpen(true);
    }
  }, [searchParams]);

  // Plan filter options are now dynamic
  const dynamicPlanOptions = [
    { value: "all", label: "All Plans" },
    ...plans.map((p) => ({ value: p.name.toLowerCase(), label: p.name }))
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
      (planFilter === "all" || client.plan.toLowerCase() === planFilter)
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
    // Call backend to add client
    const response = await api.createClient({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await response.json();
    if (data.success) {
      setIsAddClientSheetOpen(false);
      // Refresh client list
      fetchClients();
      toast({ title: "Client Added", description: "The new client has been successfully added." });
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
      const res = await api.updateClient(clientId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });
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
            <p className="text-muted-foreground">Manage and view all client accounts.</p>
        </div>
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
                <TableHead>Usage</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedClients.map((client) => (
                <TableRow key={client.id}>
                    <TableCell>
                      <Link href={`/clients/details-usage?clientId=${client.id}`} className="hover:underline">
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
                          onCheckedChange={() => handleStatusChange(client.id, client.status === "Active" ? "Suspended" : "Active")}
                          aria-label="Toggle client status"
                        />
                      </div>
                    </TableCell>
                    <TableCell>{client.plan}</TableCell>
                    <TableCell>{`${client.totalCallsMade} / ${client.monthlyCallLimit}`}</TableCell>
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
                            <Link href={`/clients/details-usage?clientId=${client.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/clients/edit?clientId=${client.id}`}>
                                <Edit2 className="mr-2 h-4 w-4" /> Edit Client
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/client-admin/dashboard`}> {}
                                <UserCog className="mr-2 h-4 w-4" /> Admin Panel
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {client.status === "Active" && (
                            <DropdownMenuItem className="text-yellow-600 focus:bg-yellow-50 focus:text-yellow-700" onClick={() => handleStatusChange(client.id, 'Suspended')}>
                            <UserX className="mr-2 h-4 w-4" /> Suspend
                            </DropdownMenuItem>
                        )}
                        {client.status === "Suspended" && (
                            <DropdownMenuItem className="text-green-600 focus:bg-green-50 focus:text-green-700" onClick={() => handleStatusChange(client.id, 'Active')}>
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
    </div>
  );
}

