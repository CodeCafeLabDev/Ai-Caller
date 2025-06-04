
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import {
  Search,
  ListFilter,
  MoreHorizontal,
  FileDown,
  RefreshCw,
  Eye,
  CalendarIcon,
  ChevronsUpDown,
  Check,
  DollarSign,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, addDays, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { Metadata } from 'next';

// export const metadata: Metadata = {
//   title: 'Billing & Invoices - Voxaiomni',
//   description: 'Monitor client transactions, manage invoices, and track payment statuses.',
//   keywords: ['billing', 'invoices', 'payments', 'transactions', 'saas billing', 'voxaiomni'],
// };

type PaymentStatus = "Paid" | "Failed" | "Pending" | "Overdue";

type Invoice = {
  id: string;
  invoiceId: string;
  clientName: string;
  clientId: string; 
  planName: string;
  amount: number;
  currency: string;
  dateIssued: Date;
  dueDate: Date;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  pdfUrl?: string; 
};

const mockClientsForFilter = [
  { id: "client_1", name: "Innovate Corp" },
  { id: "client_2", name: "Solutions Ltd" },
  { id: "client_3", name: "Tech Ventures" },
  { id: "client_4", name: "Global Connect" },
  { id: "client_5", name: "Synergy Systems" },
];

const initialMockInvoices: Invoice[] = [
  { id: "inv_1", invoiceId: "INV-2024-001", clientName: "Innovate Corp", clientId: "client_1", planName: "Premium Annual", amount: 990, currency: "USD", dateIssued: subDays(new Date(), 5), dueDate: addDays(new Date(), 25), paymentStatus: "Paid", paymentMethod: "Credit Card", pdfUrl: "/mock-invoice.pdf" },
  { id: "inv_2", invoiceId: "INV-2024-002", clientName: "Solutions Ltd", clientId: "client_2", planName: "Basic Monthly", amount: 29, currency: "USD", dateIssued: subDays(new Date(), 10), dueDate: addDays(new Date(), 20), paymentStatus: "Pending", paymentMethod: "Bank Transfer", pdfUrl: "/mock-invoice.pdf" },
  { id: "inv_3", invoiceId: "INV-2024-003", clientName: "Tech Ventures", clientId: "client_3", planName: "Trial", amount: 0, currency: "USD", dateIssued: subDays(new Date(), 15), dueDate: addDays(new Date(), 15), paymentStatus: "Paid", pdfUrl: "/mock-invoice.pdf" },
  { id: "inv_4", invoiceId: "INV-2024-004", clientName: "Global Connect", clientId: "client_4", planName: "Enterprise Custom", amount: 5000, currency: "USD", dateIssued: subDays(new Date(), 2), dueDate: addDays(new Date(), 28), paymentStatus: "Failed", paymentMethod: "Credit Card", pdfUrl: "/mock-invoice.pdf" },
  { id: "inv_5", invoiceId: "INV-2024-005", clientName: "Synergy Systems", clientId: "client_5", planName: "Premium Monthly", amount: 99, currency: "USD", dateIssued: subDays(new Date(), 35), dueDate: subDays(new Date(), 5), paymentStatus: "Overdue", paymentMethod: "Credit Card", pdfUrl: "/mock-invoice.pdf" },
  { id: "inv_6", invoiceId: "INV-2024-006", clientName: "Innovate Corp", clientId: "client_1", planName: "Basic Monthly Addon", amount: 15, currency: "USD", dateIssued: subDays(new Date(), 1), dueDate: addDays(new Date(), 29), paymentStatus: "Pending" },
];

const statusVariants: Record<PaymentStatus, string> = {
  Paid: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
  Failed: "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100",
  Pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100",
  Overdue: "bg-orange-100 text-orange-700 dark:bg-orange-700 dark:text-orange-100",
};

const paymentStatusOptions: { value: PaymentStatus | "all"; label: string }[] = [
    { value: "all", label: "All Statuses" },
    { value: "Paid", label: "Paid" },
    { value: "Pending", label: "Pending" },
    { value: "Failed", label: "Failed" },
    { value: "Overdue", label: "Overdue" },
];


export default function BillingInvoicesPage() {
  const { toast } = useToast();
  const [invoices, setInvoices] = React.useState<Invoice[]>(initialMockInvoices);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedClientId, setSelectedClientId] = React.useState<string | "all">("all");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [statusFilter, setStatusFilter] = React.useState<PaymentStatus | "all">("all");

  const [clientComboboxOpen, setClientComboboxOpen] = React.useState(false);
  const [statusComboboxOpen, setStatusComboboxOpen] = React.useState(false);
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const handleAction = (actionName: string, invoiceId: string, clientName: string) => {
    if (actionName === "Retry Payment") {
      setInvoices(prevInvoices => 
        prevInvoices.map(inv => 
          inv.invoiceId === invoiceId 
            ? { ...inv, paymentStatus: "Paid", paymentMethod: `${inv.paymentMethod || 'Card'} - Retried` } 
            : inv
        )
      );
      toast({
        title: `Payment Retry Simulated`,
        description: `Invoice ${invoiceId} for ${clientName} marked as Paid.`,
      });
    } else {
      toast({
        title: `${actionName} (Simulated)`,
        description: `Action for Invoice ${invoiceId} (${clientName}).`,
      });
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const matchesSearch =
      invoice.invoiceId.toLowerCase().includes(lowerSearchTerm) ||
      invoice.clientName.toLowerCase().includes(lowerSearchTerm) ||
      invoice.planName.toLowerCase().includes(lowerSearchTerm);
    
    const matchesClient = selectedClientId === "all" || invoice.clientId === selectedClientId;
    const matchesStatus = statusFilter === "all" || invoice.paymentStatus === statusFilter;
    const matchesDate = 
        !dateRange || 
        (!dateRange.from || invoice.dateIssued >= dateRange.from) && 
        (!dateRange.to || invoice.dateIssued <= addDays(dateRange.to,1)); 

    return matchesSearch && matchesClient && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    toast({
      title: `Exporting as ${format.toUpperCase()} (Simulated)`,
      description: `Preparing ${filteredInvoices.length} invoice records for export.`,
    });
    console.log(`Exporting ${format.toUpperCase()} data (Invoices):`, filteredInvoices);
  };


  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Billing &amp; Invoices</h1>
        <p className="text-muted-foreground">Monitor client transactions and manage invoices.</p>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
                <CardTitle>Filter Invoices</CardTitle>
                <CardDescription>Refine the list of invoices by various criteria.</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="mt-4 md:mt-0">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Search ID, Client, Plan..."
                className="pl-10 w-full bg-background h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <Popover open={clientComboboxOpen} onOpenChange={setClientComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={clientComboboxOpen}
                  className="w-full justify-between h-10"
                >
                  {selectedClientId === "all" ? "All Clients" : mockClientsForFilter.find(c => c.id === selectedClientId)?.name || "Select Client"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search client..." />
                  <CommandList>
                    <CommandEmpty>No client found.</CommandEmpty>
                    <CommandGroup>
                       <CommandItem
                            key="all-clients"
                            value="All Clients"
                            onSelect={() => {
                                setSelectedClientId("all");
                                setClientComboboxOpen(false);
                            }}
                        >
                            <Check className={cn("mr-2 h-4 w-4", selectedClientId === "all" ? "opacity-100" : "opacity-0")}/>
                            All Clients
                        </CommandItem>
                      {mockClientsForFilter.map(client => (
                        <CommandItem
                          key={client.id}
                          value={client.name}
                          onSelect={() => {
                            setSelectedClientId(client.id);
                            setClientComboboxOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", selectedClientId === client.id ? "opacity-100" : "opacity-0")}/>
                          {client.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal h-10", !dateRange && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
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
              </PopoverContent>
            </Popover>
            
            <Popover open={statusComboboxOpen} onOpenChange={setStatusComboboxOpen}>
                <PopoverTrigger asChild>
                    <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={statusComboboxOpen}
                    className="w-full justify-between h-10"
                    >
                    {paymentStatusOptions.find(s => s.value === statusFilter)?.label || "Filter by Status"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                    <CommandInput placeholder="Search status..." />
                    <CommandList>
                        <CommandEmpty>No status found.</CommandEmpty>
                        <CommandGroup>
                        {paymentStatusOptions.map(option => (
                            <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => {
                                setStatusFilter(option.value as PaymentStatus | "all");
                                setStatusComboboxOpen(false);
                            }}
                            >
                            <Check className={cn("mr-2 h-4 w-4", statusFilter === option.value ? "opacity-100" : "opacity-0")}/>
                            {option.label}
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right"><DollarSign className="inline-block mr-1 h-4 w-4"/>Amount</TableHead>
                <TableHead>Date Issued</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInvoices.length > 0 ? paginatedInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceId}</TableCell>
                  <TableCell>{invoice.clientName}</TableCell>
                  <TableCell>{invoice.planName}</TableCell>
                  <TableCell className="text-right">{invoice.currency} {invoice.amount.toFixed(2)}</TableCell>
                  <TableCell>{format(invoice.dateIssued, "MMM dd, yyyy")}</TableCell>
                  <TableCell>{format(invoice.dueDate, "MMM dd, yyyy")}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusVariants[invoice.paymentStatus]}`}>
                      {invoice.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{invoice.paymentMethod || "-"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Invoice Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleAction("View Details", invoice.invoiceId, invoice.clientName)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction("Download PDF", invoice.invoiceId, invoice.clientName)} disabled={!invoice.pdfUrl}>
                          <FileDown className="mr-2 h-4 w-4" /> Download PDF
                        </DropdownMenuItem>
                        {(invoice.paymentStatus === "Failed" || invoice.paymentStatus === "Overdue") && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-blue-600 focus:bg-blue-50 focus:text-blue-700" onClick={() => handleAction("Retry Payment", invoice.invoiceId, invoice.clientName)}>
                              <RefreshCw className="mr-2 h-4 w-4" /> Retry Payment
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    No invoices found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
           <div className="text-xs text-muted-foreground">
             Showing <strong>{paginatedInvoices.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong>
             -<strong>{Math.min(currentPage * itemsPerPage, filteredInvoices.length)}</strong> of <strong>{filteredInvoices.length}</strong> invoices
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
