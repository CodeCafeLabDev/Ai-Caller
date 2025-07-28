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
  UserCog,
} from "lucide-react";
import { AddClientForm } from "@/components/clients/add-client-form";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/use-toast";
import type { AddClientFormValues } from "@/components/clients/add-client-form";
import { Switch } from "@/components/ui/switch";
import { exportAsCSV, exportAsExcel, exportAsPDF } from '@/lib/exportUtils';
import { useSearchParams, useRouter } from "next/navigation";
import { api } from '@/lib/apiConfig';

// Type definitions and constants

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

export default function ClientsList() {
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
    router.push(`/clients/list?editClient=${client.id}`);
  };

  const handleEditClientSuccess = async (formData: any) => {
    if (!editingClient) return;
    const { planName, ...formToSend } = formData;
    const res = await api.updateClient(editingClient.id, formToSend);
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
    const response = await api.createClient(formData);
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
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Button onClick={() => setIsAddClientSheetOpen(true)}>
          <PlusCircle className="mr-2" /> Add New Client
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Input
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <DropdownMenu open={statusComboboxOpen} onOpenChange={setStatusComboboxOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[180px]">
              Status: <span className="capitalize">{statusFilter === "all" ? "All Statuses" : statusFilter}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>
              All Statuses
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("active")}>
              Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("suspended")}>
              Suspended
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("trial")}>
              Trial
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu open={planComboboxOpen} onOpenChange={setPlanComboboxOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[180px]">
              Plan: <span className="capitalize">{planFilter === "all" ? "All Plans" : planFilter}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Filter by Plan</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setPlanFilter("all")}>
              All Plans
            </DropdownMenuItem>
            {dynamicPlanOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setPlanFilter(option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu open={sortComboboxOpen} onOpenChange={setSortComboboxOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[180px]">
              Sort by: <span className="capitalize">{sortBy === "joinedDateDesc" ? "Newest First" : sortBy === "joinedDateAsc" ? "Oldest First" : sortBy === "nameAsc" ? "Name (A-Z)" : "Name (Z-A)"}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSortBy("joinedDateDesc")}>
              Newest First
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("joinedDateAsc")}>
              Oldest First
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("nameAsc")}>
              Name (A-Z)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("nameDesc")}>
              Name (Z-A)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={() => handleExport("csv")}>
          <FileDown className="mr-2" /> Export CSV
        </Button>
        <Button onClick={() => handleExport("excel")}>
          <FileText className="mr-2" /> Export Excel
        </Button>
        <Button onClick={() => handleExport("pdf")}>
          <FileText className="mr-2" /> Export PDF
        </Button>
      </div>

      <Sheet open={isAddClientSheetOpen} onOpenChange={setIsAddClientSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add New Client</SheetTitle>
            <SheetDescription>
              Add a new client to your list.
            </SheetDescription>
          </SheetHeader>
          <AddClientForm onSuccess={handleAddClientSuccess} onCancel={() => setIsAddClientSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      <Sheet open={isEditClientSheetOpen} onOpenChange={setIsEditClientSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Client</SheetTitle>
            <SheetDescription>
              Edit the details of the client.
            </SheetDescription>
          </SheetHeader>
          <AddClientForm
            client={editingClient}
            onSuccess={handleEditClientSuccess}
            onCancel={() => setIsEditClientSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Contact Person</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Calls Made</TableHead>
            <TableHead>Monthly Limit</TableHead>
            <TableHead>Joined Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedClients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>{client.clientId}</TableCell>
              <TableCell>{client.name}</TableCell>
              <TableCell>{client.contactPerson}</TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell>{client.phone}</TableCell>
              <TableCell>
                <Badge variant={client.status === "Active" ? "default" : client.status === "Suspended" ? "destructive" : "secondary"}>
                  {client.status}
                </Badge>
              </TableCell>
              <TableCell>{client.plan}</TableCell>
              <TableCell>{client.totalCallsMade}</TableCell>
              <TableCell>{client.monthlyCallLimit}</TableCell>
              <TableCell>{new Date(client.joinedDate).toLocaleDateString()}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditClient(client)}>
                      <Edit2 className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'Suspended')}>
                      <UserX className="mr-2 h-4 w-4" /> Suspend
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'Active')}>
                      <UserCheck className="mr-2 h-4 w-4" /> Activate
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="mx-2">Page {currentPage} of {totalPages}</span>
          <Button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
} 