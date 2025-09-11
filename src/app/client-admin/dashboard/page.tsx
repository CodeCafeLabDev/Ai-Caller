
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Megaphone, Users, CreditCard, BarChart3, PieChart, Settings, UserCircle, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/apiConfig";
import { useUser } from "@/lib/utils";

// Types for client dashboard data
interface ClientDashboardData {
  companyName: string;
  currentPlan: string;
  activeCampaigns: number;
  totalCallsThisMonth: number;
  callLimit: number;
  usersCount: number;
  renewalDate: string;
  loading: boolean;
  error: string | null;
}

interface ClientCampaign {
  id: string;
  name: string;
  status: string;
  totalCallsScheduled: number;
  totalCallsDispatched: number;
  successRate: number;
  createdAt: string;
}

interface ClientUsage {
  monthlyCalls: number;
  monthlyLimit: number;
  lifetimeCalls: number;
  period: string;
}

export default function ClientAdminDashboardPage() {
  const { user } = useUser();
  const [dashboardData, setDashboardData] = useState<ClientDashboardData>({
    companyName: "Loading...",
    currentPlan: "Loading...",
    activeCampaigns: 0,
    totalCallsThisMonth: 0,
    callLimit: 0,
    usersCount: 0,
    renewalDate: "Loading...",
    loading: true,
    error: null,
  });

  const [campaigns, setCampaigns] = useState<ClientCampaign[]>([]);
  const [usage, setUsage] = useState<ClientUsage>({
    monthlyCalls: 0,
    monthlyLimit: 0,
    lifetimeCalls: 0,
    period: "current_month",
  });

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch client dashboard data
  const fetchDashboardData = async () => {
    if (!user?.clientId && !user?.userId) {
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: "No client ID found. Please contact support.",
      }));
      return;
    }

    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));

      const clientId = user.clientId || user.userId;
      console.log('[ClientDashboard] Fetching data for client:', clientId);

      // Fetch multiple data sources in parallel
      const [clientRes, campaignsRes, usageRes, usersRes, assignedPlansRes] = await Promise.all([
        api.getClient(clientId),
        api.getCampaignsForClient(clientId),
        api.getElevenLabsUsage(clientId),
        api.getClientUsersForClient(clientId),
        api.getAssignedPlansForClient(clientId),
      ]);

      // Process client data
      const clientData = await clientRes.json();
      const companyName = clientData.success ? clientData.data.companyName : "Unknown Company";

      // Process campaigns data
      const campaignsData = await campaignsRes.json();
      const campaignsList = campaignsData.batch_calls || [];
      const activeCampaigns = campaignsList.filter((campaign: any) => 
        campaign.status === 'in_progress' || campaign.status === 'pending'
      ).length;

      // Process usage data
      const usageData = await usageRes.json();
      const usageInfo = usageData.success ? usageData.data : usage;

      // Process users data
      const usersData = await usersRes.json();
      const usersCount = usersData.success ? usersData.data.length : 0;

      // Process assigned plans data
      const assignedPlansData = await assignedPlansRes.json();
      const currentPlan = assignedPlansData.success && assignedPlansData.data.length > 0 
        ? assignedPlansData.data[0].planName || "No Plan Assigned"
        : "No Plan Assigned";

      // Calculate renewal date (simplified - you might want to get this from the plan data)
      const renewalDate = new Date();
      renewalDate.setMonth(renewalDate.getMonth() + 1);
      const renewalDateStr = renewalDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      // Process campaigns for display
      const processedCampaigns = campaignsList.map((campaign: any) => ({
        id: campaign.id || campaign.batch_id,
        name: campaign.name || 'Unnamed Campaign',
        status: campaign.status || 'unknown',
        totalCallsScheduled: campaign.total_calls_scheduled || 0,
        totalCallsDispatched: campaign.total_calls_dispatched || 0,
        successRate: campaign.total_calls_scheduled > 0 
          ? Math.round((campaign.total_calls_dispatched / campaign.total_calls_scheduled) * 100)
          : 0,
        createdAt: campaign.created_at || new Date().toISOString(),
      }));

      setDashboardData({
        companyName,
        currentPlan,
        activeCampaigns,
        totalCallsThisMonth: usageInfo.monthlyCalls,
        callLimit: usageInfo.monthlyLimit,
        usersCount,
        renewalDate: renewalDateStr,
        loading: false,
        error: null,
      });

      setCampaigns(processedCampaigns);
      setUsage(usageInfo);
      setLastRefresh(new Date());

    } catch (error) {
      console.error('Error fetching client dashboard data:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
      }));
    }
  };

  // Initial data fetch and auto-refresh
  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return "text-green-600";
      case 'in_progress':
        return "text-blue-600";
      case 'pending':
        return "text-yellow-600";
      case 'failed':
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (dashboardData.loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Loading dashboard data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
            <p className="text-muted-foreground mb-4">{dashboardData.error}</p>
            <button 
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
      <div>
          <h1 className="text-3xl font-bold font-headline">Welcome, {dashboardData.companyName}!</h1>
        <p className="text-muted-foreground">Here's an overview of your account activity.</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4" />
          <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Megaphone className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              {campaigns.length} total campaigns
            </p>
            <Button variant="link" asChild className="px-0 pt-2 text-xs">
              <Link href="/client-admin/campaigns">Manage Campaigns</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Calls</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalCallsThisMonth} / {dashboardData.callLimit}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.callLimit > 0 
                ? `${Math.round((dashboardData.totalCallsThisMonth / dashboardData.callLimit) * 100)}% of limit used`
                : `${usage.lifetimeCalls} lifetime calls`
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Users</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.usersCount}</div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
             <Button variant="link" asChild className="px-0 pt-2 text-xs">
              <Link href="/client-admin/users">Manage Users</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{dashboardData.currentPlan}</div>
            <p className="text-xs text-muted-foreground">Renews on {dashboardData.renewalDate}</p>
             <Button variant="link" asChild className="px-0">
              <Link href="/client-admin/billing">View Billing</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-5 w-5"/>Campaign Performance Overview</CardTitle>
            <CardDescription>Summary of your recent campaigns.</CardDescription>
          </CardHeader>
          <CardContent>
            {campaigns.length > 0 ? (
              <div className="space-y-4">
                {campaigns.slice(0, 5).map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {campaign.totalCallsScheduled} calls scheduled
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {campaign.successRate}% success
                      </p>
                    </div>
                  </div>
                ))}
                {campaigns.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{campaigns.length - 5} more campaigns
                  </p>
                )}
             <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href="/client-admin/campaigns">View All Campaigns</Link>
            </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No campaigns found</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/client-admin/campaigns">Create Your First Campaign</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><PieChart className="mr-2 h-5 w-5"/>Usage Statistics</CardTitle>
            <CardDescription>Your current usage and limits.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Monthly Calls</span>
                <span className="text-sm">{usage.monthlyCalls} / {usage.monthlyLimit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ 
                    width: `${usage.monthlyLimit > 0 ? Math.min((usage.monthlyCalls / usage.monthlyLimit) * 100, 100) : 0}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Lifetime Calls</span>
                <span className="text-sm">{usage.lifetimeCalls}</span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Period: {usage.period === 'current_month' ? 'Current Month' : usage.period}
                </p>
              </div>
            </div>
             <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href="/client-admin/reports-analytics">View Detailed Reports</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center"><Settings className="mr-2 h-5 w-5"/>Quick Settings & Account</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/client-admin/profile"><UserCircle className="mr-2 h-4 w-4"/>My Profile</Link>
            </Button>
             <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/client-admin/billing"><CreditCard className="mr-2 h-4 w-4"/>Billing Details</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
                 <Link href="/client-admin/users"><Users className="mr-2 h-4 w-4"/>Manage Users</Link>
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}
