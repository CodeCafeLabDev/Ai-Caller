
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  Smartphone,
  MessageSquare,
  FileText,
  CalendarDays,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddPlanForm } from "@/components/plans/add-plan-form";
import { EditPlanForm } from "@/components/plans/edit-plan-form";

export type PlanStatus = "Active" | "Draft" | "Archived";

export type Plan = {
  id: string;
  name: string;
  description?: string;
  priceMonthly?: number;
  priceAnnual?: number;
  currency: string;
  durationDays?: number; // New
  totalCallsAllowedPerMonth: string; // Renamed from callMinuteLimit
  callDurationPerCallMaxMinutes?: number; // New
  numberOfAgents: number; // Renamed from agentSeats
  templatesAllowed: number; // Renamed from templateUsageLimit
  voicebotUsageCap?: string; // New
  apiAccess: boolean; // New
  customTemplates: boolean; // New
  reportingAnalytics: boolean; // New
  liveCallMonitor: boolean; // New
  overagesAllowed: boolean; // New
  overageChargesPer100Calls?: number; // New
  trialEligible: boolean; // New
  status: PlanStatus;
};

const initialMockPlans: Plan[] = [
  {
    id: "plan_basic_01",
    name: "Basic Monthly",
    description: "Ideal for small teams and startups.",
    priceMonthly: 29,
    currency: "USD",
    durationDays: 30,
    totalCallsAllowedPerMonth: "500 calls",
    callDurationPerCallMaxMinutes: 10,
    numberOfAgents: 1,
    templatesAllowed: 5,
    voicebotUsageCap: "10 hours",
    apiAccess: false,
    customTemplates: false,
    reportingAnalytics: true,
    liveCallMonitor: false,
    overagesAllowed: true,
    overageChargesPer100Calls: 5,
    trialEligible: true,
    status: "Active",
  },
  {
    id: "plan_premium_01",
    name: "Premium Annual",
    description: "Best value for growing businesses.",
    priceAnnual: 990,
    currency: "USD",
    durationDays: 365,
    totalCallsAllowedPerMonth: "2000 mins",
    callDurationPerCallMaxMinutes: 30,
    numberOfAgents: 5,
    templatesAllowed: 20,
    voicebotUsageCap: "50 hours",
    apiAccess: true,
    customTemplates: true,
    reportingAnalytics: true,
    liveCallMonitor: true,
    overagesAllowed: true,
    overageChargesPer100Calls: 3,
    trialEligible: false,
    status: "Active",
  },
  {
    id: "plan_enterprise_01",
    name: "Enterprise Custom",
    description: "Tailored solutions for large organizations.",
    currency: "USD",
    // durationDays: undefined, // Custom might not have a fixed day duration
    totalCallsAllowedPerMonth: "Unlimited",
    callDurationPerCallMaxMinutes: 60,
    numberOfAgents: 25,
    templatesAllowed: 100,
    voicebotUsageCap: "Custom",
    apiAccess: true,
    customTemplates: true,
    reportingAnalytics: true,
    liveCallMonitor: true,
    overagesAllowed: false,
    trialEligible: false,
    status: "Draft",
  },
  {
    id: "plan_starter_01",
    name: "Starter Archived",
    description: "Old starter plan.",
    priceMonthly: 15,
    currency: "USD",
    durationDays: 30,
    totalCallsAllowedPerMonth: "200 calls",
    callDurationPerCallMaxMinutes: 5,
    numberOfAgents: 1,
    templatesAllowed: 2,
    voicebotUsageCap: "5 hours",
    apiAccess: false,
    customTemplates: false,
    reportingAnalytics: false,
    liveCallMonitor: false,
    overagesAllowed: false,
    trialEligible: true,
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
  const [plans, setPlans] = React.useState<Plan[]>(initialMockPlans);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [planTypeFilter, setPlanTypeFilter] = React.useState("all"); // Based on priceMonthly/priceAnnual
  const [isAddPlanSheetOpen, setIsAddPlanSheetOpen] = React.useState(false);
  const [isEditPlanSheetOpen, setIsEditPlanSheetOpen] = React.useState(false);
  const [editingPlan, setEditingPlan] = React.useState<Plan | null>(null);

  const handleAction = (actionName: string, planName: string, planId?: string) => {
     if (actionName === "Archive Plan" || actionName === "Unarchive Plan") {
      setPlans(prevPlans => 
        prevPlans.map(p => 
          p.id === planId ? {...p, status: p.status === "Archived" ? "Active" : "Archived"} : p
        )
      );
    }
    toast({
      title: `${actionName} (Simulated)`,
      description: `Action performed on plan: ${planName}.`,
    });
  };

  const handleOpenEditSheet = (plan: Plan) => {
    setEditingPlan(plan);
    setIsEditPlanSheetOpen(true);
  };

  const handleEditPlanSuccess = (updatedPlan: Plan) => {
    setPlans(prevPlans =>
      prevPlans.map(p => (p.id === updatedPlan.id ? updatedPlan : p))
    );
    setIsEditPlanSheetOpen(false);
    setEditingPlan(null);
    toast({ title: "Plan Updated", description: `The plan "${updatedPlan.name}" has been successfully updated.` });
  };
  
  const handleAddPlanSuccess = (newPlan: Plan) => {
    setPlans(prevPlans => [newPlan, ...prevPlans]);
    setIsAddPlanSheetOpen(false);
    toast({ title: "Plan Added", description: `The new plan "${newPlan.name}" has been successfully added.` });
  };

  const filteredPlans = plans.filter((plan) => {
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
        <Sheet open={isAddPlanSheetOpen} onOpenChange={setIsAddPlanSheetOpen}>
          <SheetTrigger asChild>
            <Button size="lg">
              <PlusCircle className="mr-2 h-5 w-5" />
              Add New Plan
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-lg w-full flex flex-col" side="right">
            <SheetHeader>
              <SheetTitle>Add New Plan</SheetTitle>
              <SheetDescription>
                Fill in the details below to create a new subscription plan.
              </SheetDescription>
            </SheetHeader>
            <AddPlanForm 
              onSuccess={handleAddPlanSuccess} 
              onCancel={() => setIsAddPlanSheetOpen(false)}
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead><FileText className="inline-block mr-1 h-4 w-4"/>Description</TableHead>
                <TableHead><Smartphone className="inline-block mr-1 h-4 w-4"/>Calls/Month</TableHead>
                <TableHead><Users className="inline-block mr-1 h-4 w-4"/>Agents</TableHead>
                <TableHead><CalendarDays className="inline-block mr-1 h-4 w-4"/>Duration (Days)</TableHead>
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
                  <TableCell className="max-w-xs truncate" title={plan.description}>
                    {plan.description || "-"}
                  </TableCell>
                  <TableCell>{plan.totalCallsAllowedPerMonth}</TableCell>
                  <TableCell>{plan.numberOfAgents}</TableCell>
                  <TableCell>{plan.durationDays ? `${plan.durationDays} days` : 'N/A'}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleAction("View Plan", plan.name)} disabled>
                          <Eye className="mr-2 h-4 w-4" /> View (Soon)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEditSheet(plan)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction("Clone Plan", plan.name)}>
                          <Copy className="mr-2 h-4 w-4" /> Clone
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {plan.status !== "Archived" && (
                          <DropdownMenuItem 
                            className="text-yellow-600 focus:bg-yellow-50 focus:text-yellow-700"
                            onClick={() => handleAction("Archive Plan", plan.name, plan.id)}
                          >
                            <Archive className="mr-2 h-4 w-4" /> Archive
                          </DropdownMenuItem>
                        )}
                         {plan.status === "Archived" && (
                          <DropdownMenuItem 
                            className="text-green-600 focus:bg-green-50 focus:text-green-700"
                            onClick={() => handleAction("Unarchive Plan", plan.name, plan.id)}
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

      {editingPlan && (
        <Sheet open={isEditPlanSheetOpen} onOpenChange={(isOpen) => {
          setIsEditPlanSheetOpen(isOpen);
          if (!isOpen) setEditingPlan(null);
        }}>
          <SheetContent className="sm:max-w-lg w-full flex flex-col" side="right">
            <SheetHeader>
              <SheetTitle>Edit Plan: {editingPlan.name}</SheetTitle>
              <SheetDescription>
                Modify the details of this subscription plan.
              </SheetDescription>
            </SheetHeader>
            <EditPlanForm 
              plan={editingPlan} 
              onSuccess={handleEditPlanSuccess}
              onCancel={() => {
                setIsEditPlanSheetOpen(false);
                setEditingPlan(null);
              }}
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

    