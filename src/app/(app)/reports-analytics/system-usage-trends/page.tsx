
"use client";

import * as React from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Users,
  Cpu,
  DollarSign,
  Languages,
  CalendarDays,
  Zap,
  Clock,
  BarChart3,
  AreaChart,
  PieChart,
} from "lucide-react";
// Removed: import type { Metadata } from 'next';

// export const metadata: Metadata = {
//   title: 'System Usage Trends - Voxaiomni',
//   description: 'Monitor overall system performance, resource utilization, call volumes, and AI model costs over time.',
//   keywords: ['system usage', 'performance trends', 'resource utilization', 'call volume', 'ai costs', 'voxaiomni analytics'],
// };

export default function SystemUsageTrendsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <LineChart className="mr-3 h-8 w-8 text-primary" /> System Usage Trends
        </h1>
        <p className="text-muted-foreground">
          Monitor overall system performance and resource utilization over time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center"><AreaChart className="mr-2 h-5 w-5" />Total Calls Over Time</CardTitle>
            <CardDescription>Daily/Weekly/Monthly call volumes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Image
              src="https://placehold.co/800x400.png"
              alt="Placeholder: Area chart for Total Calls Over Time"
              width={800}
              height={400}
              className="rounded-md w-full"
              data-ai-hint="area chart"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Clock className="mr-2 h-5 w-5" />Avg. Call Duration Over Time</CardTitle>
            <CardDescription>Track average call length trends.</CardDescription>
          </CardHeader>
          <CardContent>
            <Image
              src="https://placehold.co/400x300.png"
              alt="Placeholder: Line chart for Average Call Duration Over Time"
              width={400}
              height={300}
              className="rounded-md w-full"
              data-ai-hint="line chart"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Zap className="mr-2 h-5 w-5" />Active Campaigns Over Time</CardTitle>
            <CardDescription>Number of active campaigns.</CardDescription>
          </CardHeader>
          <CardContent>
            <Image
              src="https://placehold.co/400x300.png"
              alt="Placeholder: Line chart for Active Campaigns Over Time"
              width={400}
              height={300}
              className="rounded-md w-full"
              data-ai-hint="line chart"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5" />Top 5 Clients by Call Volume</CardTitle>
            <CardDescription>Identify your most active clients.</CardDescription>
          </CardHeader>
          <CardContent>
            <Image
              src="https://placehold.co/800x400.png"
              alt="Placeholder: Bar chart for Top 5 Clients by Call Volume"
              width={800}
              height={400}
              className="rounded-md w-full"
              data-ai-hint="bar chart"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Cpu className="mr-2 h-5 w-5" />Speech-to-Text/Text-to-Speech Usage</CardTitle>
            <CardDescription>Minutes or characters processed for STT/TTS services.</CardDescription>
          </CardHeader>
          <CardContent>
            <Image
              src="https://placehold.co/400x300.png"
              alt="Placeholder: Line chart for Speech-to-Text/Text-to-Speech Usage"
              width={400}
              height={300}
              className="rounded-md w-full"
              data-ai-hint="line chart usage"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Languages className="mr-2 h-5 w-5" />Language Distribution</CardTitle>
            <CardDescription>Breakdown of calls by language used.</CardDescription>
          </CardHeader>
          <CardContent>
            <Image
              src="https://placehold.co/400x300.png"
              alt="Placeholder: Pie chart for Language Distribution"
              width={400}
              height={300}
              className="rounded-md w-full"
              data-ai-hint="pie chart language"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><DollarSign className="mr-2 h-5 w-5" />AI Model Cost Analysis</CardTitle>
            <CardDescription>Estimated costs associated with AI model usage (e.g., OpenAI).</CardDescription>
          </CardHeader>
          <CardContent>
             <Image
              src="https://placehold.co/400x300.png"
              alt="Placeholder: Bar chart for AI Model Cost Analysis"
              width={400}
              height={300}
              className="rounded-md w-full"
              data-ai-hint="bar chart cost"
            />
            <p className="text-xs text-muted-foreground mt-2">Placeholder for AI model cost breakdown (e.g., per token, per API call).</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center"><CalendarDays className="mr-2 h-5 w-5" />Call Activity Heat Map</CardTitle>
            <CardDescription>Visual representation of call density by hour of the day and day of the week.</CardDescription>
          </CardHeader>
          <CardContent>
            <Image
              src="https://placehold.co/1200x400.png"
              alt="Placeholder: Heat map for Call Activity"
              width={1200}
              height={400}
              className="rounded-md w-full"
              data-ai-hint="heat map activity"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
