
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Users,
  Mail,
  ShieldCheck,
  FileText,
  CalendarDays,
} from "lucide-react";

type Client = {
  id: string;
  name: string;
  email: string;
  clientId: string;
  status: "Active" | "Suspended" | "Trial";
  plan: string;
  joinedDate: string;
  avatarUrl?: string;
};

const mockClients: Client[] = [
  {
    id: "1",
    name: "Innovate Corp",
    email: "contact@innovatecorp.com",
    clientId: "CL-INV001",
    status: "Active",
    plan: "Premium",
    joinedDate: "2023-01-15",
    avatarUrl: "https://placehold.co/40x40.png?text=IC",
  },
  {
    id: "2",
    name: "Solutions Ltd",
    email: "support@solutions.io",
    clientId: "CL-SOL002",
    status: "Suspended",
    plan: "Basic",
    joinedDate: "2023-03-22",
    avatarUrl: "https://placehold.co/40x40.png?text=SL",
  },
  {
    id: "3",
    name: "Tech Ventures",
    email: "admin@techventures.dev",
    clientId: "CL-TVN003",
    status: "Trial",
    plan: "Trial",
    joinedDate: "2023-05-10",
    avatarUrl: "https://placehold.co/40x40.png?text=TV",
  },
  {
    id: "4",
    name: "Global Connect",
    email: "info@globalconnect.net",
    clientId: "CL-GCN004",
    status: "Active",
    plan: "Enterprise",
    joinedDate: "2022-11-30",
  },
  {
    id: "5",
    name: "Synergy Systems",
    email: "help@synergysys.com",
    clientId: "CL-SYS005",
    status: "Active",
    plan: "Premium",
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

  // Placeholder for actual filtering and sorting logic
  const filteredClients = mockClients.filter((client) => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (
      (client.name.toLowerCase().includes(lowerSearchTerm) ||
        client.email.toLowerCase().includes(lowerSearchTerm) ||
        client.clientId.toLowerCase().includes(lowerSearchTerm)) &&
      (statusFilter === "all" || client.status.toLowerCase() === statusFilter) &&
      (planFilter === "all" || client.plan.toLowerCase() === planFilter)
    );
  });

  // Placeholder for actual sorting
  const sortedClients = [...filteredClients].sort((a, b) => {
    if (sortBy === "nameAsc") return a.name.localeCompare(b.name);
    if (sortBy === "nameDesc") return b.name.localeCompare(a.name);
    if (sortBy === "joinedDateAsc") return new Date(a.joinedDate).getTime() - new Date(b.joinedDate).getTime();
    if (sortBy === "joinedDateDesc") return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
    // Add more sort options as needed
    return 0;
  });
  
  // Basic pagination (conceptual)
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedClients.length / itemsPerPage);
  const paginatedClients = sortedClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline">All Clients</h1>
            <p className="text-muted-foreground">Manage and view all client accounts.</p>
        </div>
        <Button size="lg">
          <PlusCircle className="mr-2 h-5 w-5" />
          Add New Client
        </Button>
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
                <TableHead className="w-[250px]">Client</TableHead>
                <TableHead>Client ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedClients.map((client) => (
                <TableRow key={client.id}>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>{client.clientId}</TableCell>
                    <TableCell>{client.email}</TableCell>
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
                        <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit Client
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

// Helper components if not already globally available
// These are simplified versions. For production, use shadcn/ui Card components.
const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
    {...props}
  />
);

const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
);

const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 pt-0 ${className}`} {...props} />
);

const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex items-center p-6 pt-0 ${className}`} {...props} />
);


    