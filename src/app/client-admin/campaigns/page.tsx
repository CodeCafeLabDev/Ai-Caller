
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, PlusCircle, ListFilter, BarChart3, MoreHorizontal, Play, Pause, Edit, RefreshCw, AlertCircle, Eye, PlayCircle, PauseCircle, X, RotateCcw, Trash2, Clock } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AddClientCampaignForm } from "@/components/client-admin/campaigns/add-client-campaign-form";
import { CampaignDetailsView } from "@/components/campaigns/campaign-details-view";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/lib/utils";
import { urls } from "@/lib/config/urls";
import { addDays, format } from "date-fns";
import { cn } from "@/lib/cn";

// Campaign interface matching the admin panel
interface Campaign {
  id: string;
  name: string;
  clientName: string;
  clientId: string;
  agentName?: string;
  tags: string[];
  type: 'Outbound' | 'Inbound';
  callsAttempted: number;
  callsTargeted: number;
  startDate: Date;
  endDate: Date;
  status: 'Active' | 'Paused' | 'Completed';
  successRate: number;
  representativePhoneNumber?: string;
}

type CampaignStatus = 'Active' | 'Paused' | 'Completed';

const statusVariants = {
  Active: "bg-green-100 text-green-700",
  Paused: "bg-yellow-100 text-yellow-700",
  Completed: "bg-blue-100 text-blue-700",
};


export default function ClientCampaignsPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const [isAddCampaignSheetOpen, setIsAddCampaignSheetOpen] = React.useState(false);
  const [isViewCampaignSheetOpen, setIsViewCampaignSheetOpen] = React.useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string | null>(null);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Fetch campaigns for the current client
  const refresh = React.useCallback(async () => {
    if (!user?.clientId && !user?.userId) {
      console.log('[ClientCampaigns] No client ID found in user:', user);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const clientId = user.clientId || user.userId;
      console.log('[ClientCampaigns] Fetching campaigns for client:', clientId);
      
      const res = await fetch(urls.backend.campaigns.listForClient(clientId));
      const json = await res.json();
      
      console.log('[ClientCampaigns] API Response:', json);
      
      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch campaigns');
      }

      // Map the data similar to admin panel
      const list = Array.isArray(json?.batch_calls) ? json.batch_calls : [];
      const localOnly = Array.isArray(json?.local_only) ? json.local_only : [];
      
      console.log('[ClientCampaigns] Processing campaigns:', { listCount: list.length, localOnlyCount: localOnly.length });
      
      // Map ElevenLabs campaigns with local data
      const mapped: Campaign[] = list.map((b: any) => {
        const total = Number(b.total_calls_scheduled || b.total_calls || 0);
        const attempted = Number(b.total_calls_dispatched || 0);
        const created = b.created_at_unix ? new Date(b.created_at_unix * 1000) : (b.created_at ? new Date(b.created_at) : new Date());
        const end = b.last_updated_at_unix ? new Date(b.last_updated_at_unix * 1000) : addDays(created, 30);
        const statusLower = (b.status || '').toString().toLowerCase();
        const status: CampaignStatus = statusLower.includes('cancel') ? 'Paused' : statusLower.includes('complete') ? 'Completed' : 'Active';
        
        const localData = b.local;
        console.log('[ClientCampaigns] Mapping campaign:', { 
          id: b.id, 
          name: b.name, 
          localData: localData ? 'exists' : 'null',
          clientName: localData?.clientName,
          agentName: localData?.agentName 
        });
        
        return {
          id: String(b.id || b.batch_id || b.batchId || b.name || Math.random()),
          name: localData?.name || b.name || 'Campaign',
          clientName: localData?.clientName || b.client_name || '',
          clientId: localData?.clientId || clientId,
          agentName: localData?.agentName || b.agent_name || undefined,
          tags: [],
          type: 'Outbound' as const,
          callsAttempted: attempted,
          callsTargeted: total,
          startDate: created,
          endDate: end,
          status,
          successRate: total > 0 ? Math.round((attempted / total) * 100) : 0,
          representativePhoneNumber: undefined,
        };
      });
      
      // Also map local-only campaigns
      const localMapped: Campaign[] = localOnly.map((l: any) => {
        const created = l.createdAt ? new Date(l.createdAt) : new Date();
        const end = l.updatedAt ? new Date(l.updatedAt) : addDays(created, 30);
        
        return {
          id: String(l.id || Math.random()),
          name: l.name || 'Local Campaign',
          clientName: l.clientName || '',
          clientId: l.clientId || clientId,
          agentName: l.agentName || undefined,
          tags: [],
          type: 'Outbound' as const,
          callsAttempted: l.callsAttempted || 0,
          callsTargeted: l.callsTargeted || 0,
          startDate: created,
          endDate: end,
          status: l.status || 'Active',
          successRate: l.successRate || 0,
          representativePhoneNumber: undefined,
        };
      });
      
      const allCampaigns = [...mapped, ...localMapped];
      
      setCampaigns(allCampaigns);
    } catch (err: any) {
      console.error('[ClientCampaigns] Error fetching campaigns:', err);
      setError(err.message || 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  }, [user?.clientId, user?.userId]);

  // Initial load and periodic refresh
  React.useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000); // Refresh every 30 seconds
    return () => clearInterval(id);
  }, [refresh]);

  // Filter campaigns based on search and status
  const filteredCampaigns = React.useMemo(() => {
    return campaigns.filter(campaign => {
      const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           campaign.agentName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, searchTerm, statusFilter]);

  const handleViewCampaign = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setIsViewCampaignSheetOpen(true);
  };

  const handleCampaignAction = async (action: string, campaignId: string, campaignName: string) => {
    try {
      if (action === "Pause" || action === "Resume" || action === "Cancel" || action === "Retry") {
        const endpoint = action === "Pause" ? "cancel" : action === "Resume" ? "retry" : action === "Cancel" ? "cancel" : "retry";
        const res = await fetch(urls.backend.campaigns[endpoint](campaignId), { method: 'POST' });
        
        if (res.ok) {
          toast({ title: `Campaign ${action}d`, description: `Campaign "${campaignName}" has been ${action.toLowerCase()}d successfully.` });
          refresh(); // Refresh the list
        } else {
          throw new Error(`Failed to ${action.toLowerCase()} campaign`);
        }
      } else if (action === "View") {
        handleViewCampaign(campaignId);
      } else {
        toast({ title: `Action: ${action}`, description: `Performed on campaign "${campaignName}"` });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || `Failed to ${action.toLowerCase()} campaign`, variant: "destructive" });
    }
  };

  const handleAddCampaignSuccess = (data: any) => {
    console.log("New campaign submitted by client:", data);
    setIsAddCampaignSheetOpen(false);
    refresh(); // Refresh the campaign list
    toast({ title: "Campaign Created", description: "Your campaign has been created successfully!" });
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <Megaphone className="mr-2 h-7 w-7" /> My Campaigns
          </h1>
          <p className="text-muted-foreground">Manage and monitor your calling campaigns.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Sheet open={isAddCampaignSheetOpen} onOpenChange={setIsAddCampaignSheetOpen}>
            <SheetTrigger asChild>
              <Button size="lg" onClick={() => setIsAddCampaignSheetOpen(true)}>
                <PlusCircle className="mr-2 h-5 w-5" /> Create New Campaign
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-lg w-full flex flex-col" side="right">
              <SheetHeader>
                <SheetTitle>Create New Campaign</SheetTitle>
                <SheetDescription>
                  Fill in the details to request a new calling campaign setup.
                </SheetDescription>
              </SheetHeader>
              <AddClientCampaignForm 
                onSuccess={handleAddCampaignSuccess} 
                onCancel={() => setIsAddCampaignSheetOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Campaign Details View Sheet */}
      <Sheet open={isViewCampaignSheetOpen} onOpenChange={setIsViewCampaignSheetOpen}>
        <SheetContent className="sm:max-w-4xl w-full flex flex-col" side="right">
          <SheetHeader>
            <SheetTitle>Campaign Details</SheetTitle>
            <SheetDescription>
              View detailed information about the selected campaign.
            </SheetDescription>
          </SheetHeader>
          {selectedCampaignId && (
            <CampaignDetailsView 
              campaignId={selectedCampaignId}
              onClose={() => setIsViewCampaignSheetOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>

      <Card>
        <CardHeader>
          <CardTitle>Campaign List</CardTitle>
          <CardDescription>View, edit, and manage your campaigns.</CardDescription>
           <div className="flex flex-col md:flex-row items-center gap-4 pt-4">
            <Input 
              placeholder="Search campaigns..." 
              className="max-w-sm h-9" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px] h-9">
                <ListFilter className="mr-2 h-4 w-4" />
                <SelectValue />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Paused">Paused</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading campaigns...</p>
                  </TableCell>
                </TableRow>
              ) : filteredCampaigns.length > 0 ? (
                filteredCampaigns.map((campaign) => {
                  const typeIcons: Record<string, any> = {
                    'Outbound': Megaphone,
                    'Follow-Up': RotateCcw,
                    'Reminder': Clock,
                  };
                  const TypeIcon = typeIcons[campaign.type] || Megaphone;
                  
                  return (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
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
                      <TableCell>{`${format(campaign.startDate, "MMM dd, yyyy")} - ${campaign.endDate ? format(campaign.endDate, "MMM dd, yyyy") : 'Ongoing'}`}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${statusVariants[campaign.status as keyof typeof statusVariants]}`}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={cn(campaign.successRate >= 70 ? "text-green-600" : "text-red-600")}>
                          {campaign.successRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleCampaignAction("View", campaign.id, campaign.name)}>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              window.location.href = `/client-admin/campaigns/monitor-live?campaignId=${encodeURIComponent(campaign.id)}`;
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
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground text-lg">No campaigns found</p>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm || statusFilter !== "all" 
                        ? "Try adjusting your search or filter criteria." 
                        : "Create your first campaign to get started."}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
