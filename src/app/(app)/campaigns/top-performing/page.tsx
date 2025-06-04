
"use client";

import * as React from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, ArrowUpDown, TrendingUp, ListChecks, BarChart2 } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Top Performing Campaigns - Voxaiomni',
  description: 'Identify standout campaigns based on success rate, conversion, call volume, and feedback. Analyze factors for success.',
  keywords: ['top campaigns', 'campaign performance', 'analytics', 'best campaigns', 'voxaiomni'],
};

type TopPerformingCampaign = {
  id: string;
  name: string;
  clientName: string;
  successRate: number; 
  conversionRate: number; 
  totalCalls: number;
  bounceRate: number; 
  feedbackScore: number; 
  durationDays: number;
};

const mockTopCampaigns: TopPerformingCampaign[] = [
  { id: "tpc1", name: "Q4 High Rollers", clientName: "Innovate Corp", successRate: 95, conversionRate: 22, totalCalls: 480, bounceRate: 3, feedbackScore: 4.8, durationDays: 25 },
  { id: "tpc2", name: "Summer Sale Blitz", clientName: "Solutions Ltd", successRate: 92, conversionRate: 18, totalCalls: 1200, bounceRate: 5, feedbackScore: 4.5, durationDays: 45 },
  { id: "tpc3", name: "Feedback Drive Q2", clientName: "Global Connect", successRate: 88, conversionRate: 15, totalCalls: 300, bounceRate: 2, feedbackScore: 4.9, durationDays: 30 },
  { id: "tpc4", name: "Enterprise Outreach", clientName: "Tech Ventures", successRate: 90, conversionRate: 25, totalCalls: 650, bounceRate: 4, feedbackScore: 4.6, durationDays: 60 },
  { id: "tpc5", name: "Reactivation Pilot", clientName: "Innovate Corp", successRate: 85, conversionRate: 12, totalCalls: 250, bounceRate: 8, feedbackScore: 4.2, durationDays: 20 },
];

type SortByType = "successRate" | "conversionRate" | "totalCalls" | "feedbackScore";

const sortOptions: { value: SortByType; label: string }[] = [
  { value: "successRate", label: "Call Success Rate" },
  { value: "conversionRate", label: "Lead Conversion Rate" },
  { value: "totalCalls", label: "Total Calls Completed" },
  { value: "feedbackScore", label: "User Feedback Score" },
];

export default function TopPerformingCampaignsPage() {
  const [campaigns, setCampaigns] = React.useState<TopPerformingCampaign[]>(mockTopCampaigns);
  const [sortBy, setSortBy] = React.useState<SortByType>("successRate");

  const sortedCampaigns = React.useMemo(() => {
    return [...campaigns].sort((a, b) => {
      if (sortBy === "successRate") return b.successRate - a.successRate;
      if (sortBy === "conversionRate") return b.conversionRate - a.conversionRate;
      if (sortBy === "totalCalls") return b.totalCalls - a.totalCalls;
      if (sortBy === "feedbackScore") return b.feedbackScore - a.feedbackScore;
      return 0;
    });
  }, [campaigns, sortBy]);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <Award className="mr-3 h-8 w-8 text-primary" /> Top Performing Campaigns
        </h1>
        <p className="text-muted-foreground">
          Identify standout campaigns and analyze their success factors.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">91%</div>
            <p className="text-xs text-muted-foreground">Across top 5 campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Conversion</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18.4%</div>
            <p className="text-xs text-muted-foreground">Lead to positive outcome</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Feedback</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.6 / 5</div>
            <p className="text-xs text-muted-foreground">Average user rating</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm font-medium">Sort Campaigns By</CardTitle>
          </CardHeader>
          <CardContent className="pt-1 pb-3">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortByType)}>
              <SelectTrigger className="w-full">
                <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Select sorting criteria" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Campaign Performance List</CardTitle>
                <CardDescription>Detailed breakdown of top performing campaigns sorted by {sortOptions.find(s => s.value === sortBy)?.label.toLowerCase()}.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                 <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Campaign Name</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead className="text-center">Success %</TableHead>
                        <TableHead className="text-center">Conversion %</TableHead>
                        <TableHead className="text-center">Total Calls</TableHead>
                        <TableHead className="text-center">Bounce %</TableHead>
                        <TableHead className="text-center">Feedback</TableHead>
                        <TableHead className="text-center">Duration</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedCampaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                            <TableCell className="font-medium">{campaign.name}</TableCell>
                            <TableCell>{campaign.clientName}</TableCell>
                            <TableCell className="text-center">
                                <Badge variant={campaign.successRate > 90 ? "default" : "secondary"} className={campaign.successRate > 90 ? "bg-green-500 hover:bg-green-600" : ""}>{campaign.successRate}%</Badge>
                            </TableCell>
                             <TableCell className="text-center">
                                <div className="flex flex-col items-center">
                                    <span>{campaign.conversionRate}%</span>
                                    <Progress value={campaign.conversionRate} className="h-1.5 w-16 mt-1" />
                                </div>
                            </TableCell>
                            <TableCell className="text-center">{campaign.totalCalls}</TableCell>
                            <TableCell className="text-center">{campaign.bounceRate}%</TableCell>
                            <TableCell className="text-center">{campaign.feedbackScore}/5</TableCell>
                            <TableCell className="text-center">{campaign.durationDays} days</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                 </div>
                 {sortedCampaigns.length === 0 && (
                    <p className="p-6 text-center text-muted-foreground">No campaigns to display.</p>
                 )}
            </CardContent>
        </Card>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Top 5 by Engagement (Placeholder)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Image
                        src="https://placehold.co/600x400.png?text=Engagement+Chart"
                        alt="Placeholder: Bar chart for engagement"
                        width={600}
                        height={400}
                        className="rounded-md w-full"
                        data-ai-hint="bar chart"
                    />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Performance Trends (Placeholder)</CardTitle>
                </CardHeader>
                <CardContent>
                     <Image
                        src="https://placehold.co/600x400.png?text=Trends+Chart"
                        alt="Placeholder: Line graph for performance trends"
                        width={600}
                        height={400}
                        className="rounded-md w-full"
                        data-ai-hint="line graph"
                    />
                </CardContent>
            </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Use Cases & Insights</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><strong>Reward high-performing clients:</strong> Identify clients whose campaigns consistently excel and offer them incentives or premium support.</p>
            <p><strong>Detect best call templates:</strong> Analyze commonalities in top campaigns (e.g., script structure, AI prompts used) to refine template strategies.</p>
            <p><strong>Monitor campaigns that exceed benchmarks:</strong> Set internal benchmarks and use this page to quickly see which campaigns are outperforming, allowing for replication of successful strategies.</p>
            <p><strong>Identify areas for improvement:</strong> While focusing on top performers, implicitly understand what differentiates them from average or underperforming campaigns.</p>
        </CardContent>
      </Card>

    </div>
  );
}
