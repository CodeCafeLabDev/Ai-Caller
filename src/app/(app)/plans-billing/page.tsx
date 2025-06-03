
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
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import {
  Search,
  PlusCircle,
  ListFilter,
  MoreHorizontal,
  Eye,
  Edit2,
  Archive,
  Copy,
  DollarSign,
  Clock,
  Users,
  FileText,
  Smartphone,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PlanStatus = "Active" | "Draft" | "Archived";
type PlanDuration = "Monthly" | "Annual" | "Custom";

type Plan = {
  id: string;
  name: string;
  priceMonthly?: number;
  priceAnnual?: number;
  currency: string;
  callMinuteLimit: string; // e.g., "1000 mins" or "500 calls"
  templateUsageLimit: number;
  durationDisplay: string; // e.g., "30 Days", "1 Year"
  agentSeats: number;
  status: PlanStatus;
};

const mockPlans: Plan[] = [
  {
    id: "plan_basic_01",
    name: "Basic Monthly",
    priceMonthly: 29,
    currency: "USD",
    callMinuteLimit: "500 calls",
    templateUsageLimit: 5,
    durationDisplay: "Monthly",
    agentSeats: 1,
    status: "Active",
  },
  {
    id: "plan_premium_01",
    name: "Premium Annual",
    priceAnnual: 990,
    currency: "USD",
    callMinuteLimit: "2000 mins",
    templateUsageLimit: 20,
    durationDisplay: "1 Year",
    agentSeats: 5,
    status: "Active",
  },
  {
    id: "plan_enterprise_01",
    name: "Enterprise Custom",
    currency: "USD",
    callMinuteLimit: "Unlimited",
    templateUsageLimit: 100,
    durationDisplay: "Custom",
    agentSeats: 25,
    status: "Draft",
  },
  {
    id: "plan_starter_01",
    name: "Starter Monthly",
    priceMonthly: 15,
    currency: "USD",
    callMinuteLimit: "200 calls",
    templateUsageLimit: 2,
    durationDisplay: "Monthly",
    agentSeats: 1,
    status: "Archived",
  },
];

const statusVariants: Record<PlanStatus, string> = {
  Active: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
  Draft: "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100",
  Archived: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100",
};

export default function PlansBillingPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [planTypeFilter, setPlanTypeFilter] = React.useState("all");
  // Add more state for other filters/sorting as needed

  const handleAction = (actionName: string, planName: string) => {
    toast({
      title: `${actionName} (Simulated)`,
      description: `Action performed on plan: ${planName}.`,
    });
  };

  const filteredPlans = mockPlans.filter((plan) => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (
      plan.name.toLowerCase().includes(lowerSearchTerm) &&
      (statusFilter === "all" || plan.status.toLowerCase() === statusFilter) &&
      (planTypeFilter === "all" || (plan.priceMonthly && planTypeFilter === "monthly") || (plan.priceAnnual && planTypeFilter === "annual") || (!plan.priceMonthly && !plan.priceAnnual && planTypeFilter === "custom"))
    );
  });
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
  const paginatedPlans = filteredPlans.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Subscription Plans</h1>
          <p className="text-muted-foreground">Manage service tiers and plan configurations.</p>
        </div>
        <Button size="lg" onClick={() => handleAction("Add New Plan", "")}>
          <PlusCircle className="mr-2 h-5 w-5" />
          Add New Plan
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b p-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-grow w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by plan name..."
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
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select value={planTypeFilter} onValueChange={setPlanTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <DollarSign className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by Plan Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plan Types</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {/* Add more filters here if needed, e.g., Call Limit */}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead><Smartphone className="inline-block mr-1 h-4 w-4"/>Call/Minute Limit</TableHead>
                <TableHead><MessageSquare className="inline-block mr-1 h-4 w-4"/>Template Limit</TableHead>
                <TableHead><Clock className="inline-block mr-1 h-4 w-4"/>Duration</TableHead>
                <TableHead><Users className="inline-block mr-1 h-4 w-4"/>Agent Seats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>
                    {plan.priceMonthly && <div>${plan.priceMonthly} / mo</div>}
                    {plan.priceAnnual && <div>${plan.priceAnnual} / yr</div>}
                    {!plan.priceMonthly && !plan.priceAnnual && <div>Custom</div>}
                  </TableCell>
                  <TableCell>{plan.callMinuteLimit}</TableCell>
                  <TableCell>{plan.templateUsageLimit}</TableCell>
                  <TableCell>{plan.durationDisplay}</TableCell>
                  <TableCell>{plan.agentSeats}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusVariants[plan.status]}`}>
                      {plan.status}
                    </Badge>
                  </TableCell>
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
                        <DropdownMenuItem onClick={() => handleAction("View Plan", plan.name)}>
                          <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction("Edit Plan", plan.name)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction("Clone Plan", plan.name)}>
                          <Copy className="mr-2 h-4 w-4" /> Clone
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {plan.status !== "Archived" && (
                          <DropdownMenuItem 
                            className="text-yellow-600 focus:bg-yellow-50 focus:text-yellow-700"
                            onClick={() => handleAction("Archive Plan", plan.name)}
                          >
                            <Archive className="mr-2 h-4 w-4" /> Archive
                          </DropdownMenuItem>
                        )}
                         {plan.status === "Archived" && (
                          <DropdownMenuItem 
                            className="text-green-600 focus:bg-green-50 focus:text-green-700"
                            onClick={() => handleAction("Unarchive Plan", plan.name)}
                          >
                            <Archive className="mr-2 h-4 w-4" /> Unarchive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {paginatedPlans.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                    No plans found. Try adjusting your search or filters.
                </div>
            )}
        </CardContent>
         <CardFooter className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
           <div className="text-xs text-muted-foreground">
             Showing <strong>{paginatedPlans.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong>
             -<strong>{Math.min(currentPage * itemsPerPage, filteredPlans.length)}</strong> of <strong>{filteredPlans.length}</strong> plans
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

