"use client";

import * as React from "react";
import Link from "next/link"; // Import Link
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
  Smartphone,
  MessageSquare,
  FileText,
  CalendarDays,
  Info,
  FileDown, 
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { EditPlanForm } from "@/components/plans/edit-plan-form";
import type { Metadata } from 'next';
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { exportAsCSV, exportAsExcel, exportAsPDF } from '@/lib/exportUtils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AddPlanForm } from "@/components/plans/add-plan-form";

// export const metadata: Metadata = {
//   title: 'Subscription Plans - AI Caller',
//   description: 'Manage service tiers and subscription plan configurations for clients.',
//   keywords: ['subscription plans', 'billing', 'pricing tiers', 'saas plans', 'AI Caller'],
// };

export type PlanStatus = "Active" | "Draft" | "Archived";

export type Plan = {
  id: number;
  name: string;
  description?: string;
  priceMonthly?: number;
  priceAnnual?: number;
  currency: string;
  durationDays?: number; 
  totalCallsAllowedPerMonth: string; 
  callDurationPerCallMaxMinutes?: number; 
  numberOfAgents: number; 
  agentsAllowed: number; 
  voicebotUsageCap?: string; 
  apiAccess: boolean; 
  customAgents: boolean; 
  reportingAnalytics: boolean; 
  liveCallMonitor: boolean; 
  overagesAllowed: boolean; 
  overageChargesPer100Calls?: number; 
  trialEligible: boolean; 
  status: PlanStatus;
};

const statusVariants: Record<PlanStatus, string> = {
  Active: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
  Draft: "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100",
  Archived: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100",
};

export default function PlansBillingPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [planTypeFilter, setPlanTypeFilter] = React.useState("all");
  const [isLoading, setIsLoading] = React.useState(true);
  const [viewPlanOpen, setViewPlanOpen] = React.useState(false);
  const [planDetails, setPlanDetails] = React.useState<Plan | null>(null);
  const [planDetailsLoading, setPlanDetailsLoading] = React.useState(false);
  const [editPlanOpen, setEditPlanOpen] = React.useState(false);
  const [editPlanDetails, setEditPlanDetails] = React.useState<Plan | null>(null);
  const [editPlanLoading, setEditPlanLoading] = React.useState(false);
  const [isAddPlanSheetOpen, setIsAddPlanSheetOpen] = React.useState(false);

  // Fetch plans from API
  const fetchPlans = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/plans');
      const data = await response.json();
      if (data.success) {
        setPlans(data.data || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch plans. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to fetch plans. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch plans on mount and after operations
  React.useEffect(() => {
    fetchPlans();
    // Refetch plans when the page becomes visible again (after navigating back from edit)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchPlans();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchPlans]);

  const handleAction = async (actionName: string, planName: string, planId?: number) => {
    if (!planId) return;

    if (actionName === "Archive Plan" || actionName === "Unarchive Plan") {
      const newStatus = actionName === "Archive Plan" ? "Archived" : "Active";
      try {
        const response = await fetch(`http://localhost:5000/api/plans/${planId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });
        const data = await response.json();
        
        if (data.success) {
          await fetchPlans(); // Refresh plans after update
          toast({
            title: `${actionName} Successful`,
            description: `Plan "${planName}" has been ${newStatus.toLowerCase()}.`,
          });
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error(`Error ${actionName.toLowerCase()}:`, error);
        toast({
          title: "Error",
          description: `Failed to ${actionName.toLowerCase()}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleViewPlan = async (planId: number) => {
    setPlanDetailsLoading(true);
    setViewPlanOpen(true);
    try {
      const response = await fetch(`http://localhost:5000/api/plans/${planId}`);
      const data = await response.json();
      if (data.success && data.data) {
        setPlanDetails(data.data);
      } else {
        setPlanDetails(null);
        toast({
          title: "Error",
          description: "Failed to fetch plan details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setPlanDetails(null);
      toast({
        title: "Error",
        description: "Failed to fetch plan details.",
        variant: "destructive",
      });
    } finally {
      setPlanDetailsLoading(false);
    }
  };

  const handleEditPlan = async (planId: number) => {
    setEditPlanDetails(null);
    setEditPlanLoading(true);
    setEditPlanOpen(true);
    try {
      const response = await fetch(`http://localhost:5000/api/plans/${planId}`);
      const data = await response.json();
      if (data.success && data.data) {
        const plan = data.data;
        // No normalization needed, just use the value as-is
        setEditPlanDetails(plan);
      } else {
        setEditPlanDetails(null);
        toast({
          title: "Error",
          description: "Failed to fetch plan details for editing.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setEditPlanDetails(null);
      toast({
        title: "Error",
        description: "Failed to fetch plan details for editing.",
        variant: "destructive",
      });
    } finally {
      setEditPlanLoading(false);
    }
  };

  const handleEditPlanSave = async (updatedPlan: Plan) => {
    const cleanPlan = { ...updatedPlan };
    // Do NOT lowercase the status, just send as-is
    Object.keys(cleanPlan).forEach((key) => {
      // @ts-ignore
      if (cleanPlan[key] === undefined) delete cleanPlan[key];
    });
    console.log('Submitting plan to backend:', cleanPlan);
    try {
      const res = await fetch(`http://localhost:5000/api/plans/${updatedPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanPlan),
      });
      const result = await res.json();
      console.log('Backend response:', result);
      if (res.ok && result.success) {
        toast({
          title: "Success",
          description: "Plan updated successfully",
        });
        setEditPlanOpen(false);
        setEditPlanDetails(null);
        await fetchPlans(); // Refresh the plans list
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update plan",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update plan",
        variant: "destructive",
      });
    }
  };

  const handleEditPlanCancel = () => {
    setEditPlanOpen(false);
    setEditPlanDetails(null);
  };

  const handleClonePlan = async (planId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/plans/${planId}`);
      const data = await response.json();
      if (data.success && data.data) {
        await navigator.clipboard.writeText(JSON.stringify(data.data, null, 2));
        toast({
          title: "Copied!",
          description: "Plan data copied to clipboard.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch plan data.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy plan data.",
        variant: "destructive",
      });
    }
  };

  const handleAddPlanSuccess = async (newPlan: Plan) => {
    toast({
      title: "Success",
      description: "Plan added successfully",
    });
    setIsAddPlanSheetOpen(false);
    await fetchPlans();
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

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    if (filteredPlans.length === 0) return;
    if (format === "csv") exportAsCSV(filteredPlans, 'plans.csv');
    else if (format === "excel") exportAsExcel(filteredPlans, 'plans.xlsx');
    else if (format === "pdf") exportAsPDF(filteredPlans, 'plans.pdf');
    toast({
      title: `Exported as ${format.toUpperCase()}`,
      description: `Downloaded ${filteredPlans.length} plan records.`,
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Subscription Plans</h1>
          <p className="text-muted-foreground">Manage service tiers and plan configurations.</p>
        </div>
        <Button size="lg" onClick={() => setIsAddPlanSheetOpen(true)}>
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
            <div className="flex gap-2 flex-wrap w-full md:w-auto justify-start items-center">
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
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusVariants[plan.status]}`}>{plan.status}</Badge>
                      <Switch
                        checked={plan.status === "Active"}
                        onCheckedChange={() => handleAction(plan.status === "Active" ? "Archive Plan" : "Unarchive Plan", plan.name, plan.id)}
                        aria-label="Toggle plan status"
                      />
                    </div>
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
                        <DropdownMenuItem onClick={() => handleViewPlan(plan.id)}>
                          <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditPlan(plan.id)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleClonePlan(plan.id)}>
                          <Copy className="mr-2 h-4 w-4" /> Clone (Copy Data)
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

      {/* Sheet overlay for viewing plan details */}
      <Sheet open={viewPlanOpen} onOpenChange={setViewPlanOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Plan Details</SheetTitle>
            <SheetDescription>View all details for this subscription plan.</SheetDescription>
          </SheetHeader>
          {planDetailsLoading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : planDetails ? (
            <div className="py-4 space-y-3 text-sm max-h-[70vh] overflow-y-auto">
              <div><span className="font-medium">Name:</span> {planDetails.name}</div>
              <div><span className="font-medium">Description:</span> {planDetails.description || "-"}</div>
              <div><span className="font-medium">Monthly Price:</span> {planDetails.priceMonthly ? `$${planDetails.priceMonthly}` : "-"}</div>
              <div><span className="font-medium">Annual Price:</span> {planDetails.priceAnnual ? `$${planDetails.priceAnnual}` : "-"}</div>
              <div><span className="font-medium">Currency:</span> {planDetails.currency}</div>
              <div><span className="font-medium">Duration (Days):</span> {planDetails.durationDays || "-"}</div>
              <div><span className="font-medium">Calls/Month:</span> {planDetails.totalCallsAllowedPerMonth}</div>
              <div><span className="font-medium">Max Call Duration (min):</span> {planDetails.callDurationPerCallMaxMinutes || "-"}</div>
              <div><span className="font-medium">Agents:</span> {planDetails.numberOfAgents}</div>
              <div><span className="font-medium">Agents Allowed:</span> {planDetails.agentsAllowed}</div>
              <div><span className="font-medium">Voicebot Usage Cap:</span> {planDetails.voicebotUsageCap || "-"}</div>
              <div><span className="font-medium">API Access:</span> {planDetails.apiAccess ? "Yes" : "No"}</div>
              <div><span className="font-medium">Custom Agents:</span> {planDetails.customAgents ? "Yes" : "No"}</div>
              <div><span className="font-medium">Reporting & Analytics:</span> {planDetails.reportingAnalytics ? "Yes" : "No"}</div>
              <div><span className="font-medium">Live Call Monitor:</span> {planDetails.liveCallMonitor ? "Yes" : "No"}</div>
              <div><span className="font-medium">Overages Allowed:</span> {planDetails.overagesAllowed ? "Yes" : "No"}</div>
              <div><span className="font-medium">Overage Charges/100 Calls:</span> {planDetails.overageChargesPer100Calls ? `$${planDetails.overageChargesPer100Calls}` : "-"}</div>
              <div><span className="font-medium">Trial Eligible:</span> {planDetails.trialEligible ? "Yes" : "No"}</div>
              <div><span className="font-medium">Status:</span> {planDetails.status}</div>
            </div>
          ) : (
            <div className="py-8 text-center text-destructive">Failed to load plan details.</div>
          )}
          <div className="flex gap-2 mt-6">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setViewPlanOpen(false)}>
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet overlay for editing plan details */}
      <Sheet open={editPlanOpen} onOpenChange={setEditPlanOpen}>
        <SheetContent side="right" className="max-w-lg w-full h-full flex flex-col min-h-0">
          <SheetHeader>
            <SheetTitle>Edit Plan</SheetTitle>
            <SheetDescription>Update the details for this subscription plan.</SheetDescription>
          </SheetHeader>
          {editPlanLoading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : editPlanDetails ? (
            <div className="flex-1 flex flex-col min-h-0 h-full">
              <EditPlanForm plan={editPlanDetails} onSuccess={handleEditPlanSave} onCancel={handleEditPlanCancel} />
            </div>
          ) : (
            <div className="py-8 text-center text-destructive">Failed to load plan details for editing.</div>
          )}
        </SheetContent>
      </Sheet>

      {/* Sheet overlay for adding a new plan */}
      <Sheet open={isAddPlanSheetOpen} onOpenChange={setIsAddPlanSheetOpen}>
        <SheetContent side="right" className="max-w-lg w-full h-full flex flex-col min-h-0">
          <SheetHeader>
            <SheetTitle>Add New Plan</SheetTitle>
            <SheetDescription>Fill in the details below to create a new subscription plan.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 flex flex-col min-h-0 h-full overflow-y-auto">
            <AddPlanForm onSuccess={handleAddPlanSuccess} onCancel={() => setIsAddPlanSheetOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
