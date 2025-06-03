
"use client";

import * as React from "react";
import Link from "next/link"; // Added Link
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Search,
  PlusCircle,
  ListFilter,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Edit2,
  UserX,
  UserCheck,
  ArrowUpDown,
  FileText,
} from "lucide-react";
import { AddClientForm } from "@/components/clients/add-client-form";

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

const mockClients: Client[] = [
  {
    id: "1",
    name: "Innovate Corp",
    contactPerson: "Alice Wonderland",
    email: "contact@innovatecorp.com",
    phone: "555-0101",
    clientId: "CL-INV001",
    status: "Active",
    plan: "Premium",
    totalCallsMade: 1250,
    monthlyCallLimit: 2000,
    joinedDate: "2023-01-15",
    avatarUrl: "https://placehold.co/40x40.png?text=IC",
  },
  {
    id: "2",
    name: "Solutions Ltd",
    contactPerson: "Bob The Builder",
    email: "support@solutions.io",
    phone: "555-0102",
    clientId: "CL-SOL002",
    status: "Suspended",
    plan: "Basic",
    totalCallsMade: 300,
    monthlyCallLimit: 500,
    joinedDate: "2023-03-22",
    avatarUrl: "https://placehold.co/40x40.png?text=SL",
  },
  {
    id: "3",
    name: "Tech Ventures",
    contactPerson: "Carol Danvers",
    email: "admin@techventures.dev",
    phone: "555-0103",
    clientId: "CL-TVN003",
    status: "Trial",
    plan: "Trial",
    totalCallsMade: 50,
    monthlyCallLimit: 100,
    joinedDate: "2023-05-10",
    avatarUrl: "https://placehold.co/40x40.png?text=TV",
  },
  {
    id: "4",
    name: "Global Connect",
    contactPerson: "David Copperfield",
    email: "info@globalconnect.net",
    phone: "555-0104",
    clientId: "CL-GCN004",
    status: "Active",
    plan: "Enterprise",
    totalCallsMade: 4500,
    monthlyCallLimit: 5000,
    joinedDate: "2022-11-30",
  },
  {
    id: "5",
    name: "Synergy Systems",
    contactPerson: "Eve Harrington",
    email: "help@synergysys.com",
    phone: "555-0105",
    clientId: "CL-SYS005",
    status: "Active",
    plan: "Premium",
    totalCallsMade: 1800,
    monthlyCallLimit: 2000,
    joinedDate: "2023-02-01",
    avatarUrl: "https://placehold.co/40x40.png?text=SS",
  },
];

const statusVariants: Record<Client["status"], string> = {
  Active: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
  Suspended: "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100",
  Trial: "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100",
};


export default function AllClientsListPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [planFilter, setPlanFilter] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("joinedDateDesc");
  const [isAddClientSheetOpen, setIsAddClientSheetOpen] = React.useState(false);

  const filteredClients = mockClients.filter((client) => {
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

  const handleAddClientSuccess = () => {
    setIsAddClientSheetOpen(false); 
    console.log("Client added, sheet closed. Refresh data if needed.");
  };


  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline">All Clients</h1>
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
            <AddClientForm onSuccess={handleAddClientSuccess} />
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
            <div className="flex gap-2 flex-wrap w-full md:w-auto justify-between md:justify-start">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <ListFilter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                </SelectContent>
                </Select>

                <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <FileText className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by Plan" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="joinedDateDesc">Newest First</SelectItem>
                    <SelectItem value="joinedDateAsc">Oldest First</SelectItem>
                    <SelectItem value="nameAsc">Name (A-Z)</SelectItem>
                    <SelectItem value="nameDesc">Name (Z-A)</SelectItem>
                </SelectContent>
                </Select>
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
                    <Badge
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        statusVariants[client.status]
                        }`}
                    >
                        {client.status}
                    </Badge>
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
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/clients/details-usage?clientId=${client.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {client.status === "Active" && (
                            <DropdownMenuItem className="text-yellow-600 focus:bg-yellow-50 focus:text-yellow-700">
                            <UserX className="mr-2 h-4 w-4" /> Suspend
                            </DropdownMenuItem>
                        )}
                        {client.status === "Suspended" && (
                            <DropdownMenuItem className="text-green-600 focus:bg-green-50 focus:text-green-700">
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

