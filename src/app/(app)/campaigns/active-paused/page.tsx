
"use client";

import * as React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  PlayCircle,
  PauseCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  BarChartHorizontalBig,
  ListChecks,
} from "lucide-react";
import { format, subDays, addDays } from "date-fns";
import type { Metadata } from 'next';

// export const metadata: Metadata = {
//   title: 'Active & Paused Campaigns - Voxaiomni',
//   description: 'View and manage currently running or paused campaigns and their key real-time metrics.',
//   keywords: ['active campaigns', 'paused campaigns', 'live campaigns', 'campaign status', 'voxaiomni'],
// };

type CampaignStatus = "Active" | "Paused" | "Completed"; 

interface Campaign {
  id: string;
  name: string;
  clientName: string;
  status: CampaignStatus;
  callsAttempted: number;
  callsTargeted: number;
  startDate: Date;
  endDate: Date;
}

const mockCampaignsData: Campaign[] = [
  {
    id: "camp_active_1",
    name: "Q4 Lead Generation",
    clientName: "Innovate Corp",
    status: "Active",
    callsAttempted: 450,
    callsTargeted: 500,
    startDate: subDays(new Date(), 10),
    endDate: addDays(new Date(), 20),
  },
  {
    id: "camp_paused_1",
    name: "New Product Launch",
    clientName: "Solutions Ltd",
    status: "Paused",
    callsAttempted: 180,
    callsTargeted: 200,
    startDate: subDays(new Date(), 5),
    endDate: addDays(new Date(), 25),
  },
  {
    id: "camp_active_2",
    name: "Customer Feedback Follow-up",
    clientName: "Global Connect",
    status: "Active",
    callsAttempted: 300,
    callsTargeted: 350,
    startDate: subDays(new Date(), 15),
    endDate: addDays(new Date(), 15),
  },
  {
    id: "camp_paused_2",
    name: "Appointment Reminders - Aug",
    clientName: "Tech Ventures",
    status: "Paused",
    callsAttempted: 50,
    callsTargeted: 100,
    startDate: subDays(new Date(), 2),
    endDate: addDays(new Date(), 28),
  },
   {
    id: "camp_completed_1", 
    name: "Old Q1 Promo",
    clientName: "Innovate Corp",
    status: "Completed",
    callsAttempted: 100,
    callsTargeted: 100,
    startDate: subDays(new Date(), 90),
    endDate: subDays(new Date(), 60),
  },
];

interface RealTimeMetrics {
  callsPerMinute: string;
  connectedRate: string;
  failedRate: string;
  avgCallDuration: string;
}

const activeMetrics: RealTimeMetrics = {
  callsPerMinute: "12",
  connectedRate: "85",
  failedRate: "5",
  avgCallDuration: "3:45 min",
};

const pausedMetrics: RealTimeMetrics = {
  callsPerMinute: "0",
  connectedRate: "N/A",
  failedRate: "N/A",
  avgCallDuration: "N/A",
};

export default function ActivePausedCampaignsPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = React.useState<Campaign[]>(mockCampaignsData);
  const [currentTab, setCurrentTab] = React.useState<"active" | "paused">("active");

  const handleToggleStatus = (campaignId: string) => {
    setCampaigns((prevCampaigns) =>
      prevCampaigns.map((campaign) => {
        if (campaign.id === campaignId) {
          const newStatus = campaign.status === "Active" ? "Paused" : "Active";
          toast({
            title: `Campaign ${newStatus === "Active" ? "Resumed" : "Paused"}`,
            description: `Campaign "${campaign.name}" is now ${newStatus.toLowerCase()}.`,
          });
          return { ...campaign, status: newStatus };
        }
        return campaign;
      })
    );
  };

  const handleMonitorNow = (campaignName: string) => {
    toast({
      title: "Monitor Campaign",
      description: `Navigating to monitor "${campaignName}". (Functionality to be implemented)`,
    });
    // router.push(`/campaigns/monitor-live?campaignId=${campaignId}`); 
  };

  const displayedCampaigns = campaigns.filter(
    (campaign) => campaign.status.toLowerCase() === currentTab
  );

  const currentMetrics = currentTab === "active" ? activeMetrics : pausedMetrics;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Active & Paused Campaigns</h1>
        <p className="text-muted-foreground">
          View currently running or paused campaigns and their key metrics.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Real-Time Metrics Overview</CardTitle>
          <CardDescription>
            Aggregated metrics for {currentTab === "active" ? "Active" : "Paused"} campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center p-4 bg-muted/50 rounded-lg">
            <Activity className="h-8 w-8 text-primary mr-4" />
            <div>
              <p className="text-sm text-muted-foreground">Calls/minute</p>
              <p className="text-2xl font-bold">{currentMetrics.callsPerMinute}</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-muted/50 rounded-lg">
            <TrendingUp className="h-8 w-8 text-green-500 mr-4" />
            <div>
              <p className="text-sm text-muted-foreground">Connected %</p>
              <p className="text-2xl font-bold">{currentMetrics.connectedRate}</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-muted/50 rounded-lg">
            <TrendingDown className="h-8 w-8 text-red-500 mr-4" />
            <div>
              <p className="text-sm text-muted-foreground">Failed %</p>
              <p className="text-2xl font-bold">{currentMetrics.failedRate}</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-muted/50 rounded-lg">
            <Clock className="h-8 w-8 text-blue-500 mr-4" />
            <div>
              <p className="text-sm text-muted-foreground">Avg. Call Duration</p>
              <p className="text-2xl font-bold">{currentMetrics.avgCallDuration}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as "active" | "paused")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3">
          <TabsTrigger value="active">
            <PlayCircle className="mr-2 h-4 w-4" /> Active Campaigns
          </TabsTrigger>
          <TabsTrigger value="paused">
            <PauseCircle className="mr-2 h-4 w-4" /> Paused Campaigns
          </TabsTrigger>
        </TabsList>
        
        {(["active", "paused"] as const).map(tabStatus => (
            <TabsContent key={tabStatus} value={tabStatus} className="mt-6">
            {displayedCampaigns.filter(c => c.status.toLowerCase() === tabStatus).length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedCampaigns
                    .filter(c => c.status.toLowerCase() === tabStatus)
                    .map((campaign) => (
                    <Card key={campaign.id} className="shadow-md">
                        <CardHeader>
                        <CardTitle className="truncate">{campaign.name}</CardTitle>
                        <CardDescription>{campaign.clientName}</CardDescription>
                        <CardDescription className="text-xs">
                            {format(campaign.startDate, "MMM dd, yyyy")} - {format(campaign.endDate, "MMM dd, yyyy")}
                        </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor={`status-toggle-${campaign.id}`} className="text-sm">
                            {campaign.status === "Active" ? "Running" : "Paused"}
                            </Label>
                            <Switch
                            id={`status-toggle-${campaign.id}`}
                            checked={campaign.status === "Active"}
                            onCheckedChange={() => handleToggleStatus(campaign.id)}
                            aria-label={campaign.status === "Active" ? "Pause campaign" : "Resume campaign"}
                            />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Call Progress</p>
                            <div className="flex justify-between items-baseline">
                                <p className="text-lg font-semibold">
                                    {campaign.callsAttempted} / {campaign.callsTargeted}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    ({Math.round((campaign.callsAttempted / campaign.callsTargeted) * 100)}%)
                                </p>
                            </div>
                            <Progress
                            value={ (campaign.callsTargeted > 0 ? (campaign.callsAttempted / campaign.callsTargeted) * 100 : 0)}
                            className="h-2 mt-1"
                            aria-label={`${Math.round((campaign.callsAttempted / campaign.callsTargeted) * 100)}% of calls attempted`}
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleMonitorNow(campaign.name)}
                        >
                            <BarChartHorizontalBig className="mr-2 h-4 w-4" /> Monitor Now
                        </Button>
                        </CardContent>
                    </Card>
                ))}
                </div>
            ) : (
                <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                    No {tabStatus} campaigns to display.
                </p>
                {tabStatus === "active" && <p className="text-sm text-muted-foreground">Try resuming a paused campaign or creating a new one.</p>}
                {tabStatus === "paused" && <p className="text-sm text-muted-foreground">Try pausing an active campaign.</p>}
                </div>
            )}
            </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
