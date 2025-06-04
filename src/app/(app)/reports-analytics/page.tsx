
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarClock, LineChart, AlertTriangle, Download, Users, BarChartBig, TrendingUp, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Reports & Analytics Overview | Admin - Voxaiomni',
  description: 'Access various reports, data visualizations, and performance analytics for your Voxaiomni system.',
  keywords: ['reports', 'analytics', 'data visualization', 'performance metrics', 'voxaiomni admin'],
};

const reportSections = [
  {
    title: "Call Reports",
    description: "Analyze call performance, track trends, and gain insights with daily and monthly reports.",
    href: "/reports-analytics/call-reports",
    icon: CalendarClock,
  },
  {
    title: "System Usage Trends",
    description: "Monitor overall system performance, resource utilization, call volumes, and AI model costs.",
    href: "/reports-analytics/system-usage-trends",
    icon: TrendingUp,
  },
  {
    title: "Error & Failed Call Logs",
    description: "Investigate system errors, failed calls, and manage resolutions with detailed logs.",
    href: "/reports-analytics/error-logs",
    icon: AlertTriangle,
  },
  {
    title: "Export Data",
    description: "Download comprehensive datasets for offline analysis or backup purposes.",
    href: "/reports-analytics/export-data",
    icon: Download,
  },
];

export default function ReportsAnalyticsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-3">
        <BarChartBig className="h-10 w-10 text-primary" />
        <div>
            <h1 className="text-4xl font-bold font-headline">Reports & Analytics</h1>
            <p className="text-xl text-muted-foreground">
              Gain actionable insights into your Voxaiomni system's performance.
            </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {reportSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Card key={section.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <IconComponent className="mr-3 h-6 w-6 text-primary" />
                  {section.title}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href={section.href}>
                    Go to {section.title} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
       <Card>
        <CardHeader>
            <CardTitle>About This Section</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>The Reports & Analytics hub provides comprehensive tools to monitor, analyze, and optimize your AI calling operations.</p>
            <p>Dive into detailed call reports, track system-wide usage patterns, troubleshoot errors, and export raw data for further analysis.</p>
        </CardContent>
      </Card>
    </div>
  );
}
