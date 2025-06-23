
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Megaphone, Users, CreditCard, BarChart3, PieChart, Settings, UserCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Client Admin - AI Caller',
  description: 'Overview of your account activity, campaigns, and usage statistics in the AI Caller client admin panel.',
  keywords: ['client dashboard', 'campaigns', 'usage statistics', 'billing', 'AI Caller client'],
};

export default function ClientAdminDashboardPage() {
  // Mock data - this would come from an API in a real app
  const clientData = {
    companyName: "Innovate Corp", // This could be dynamically fetched
    currentPlan: "Premium Monthly",
    activeCampaigns: 3,
    totalCallsThisMonth: 1250,
    callLimit: 2000,
    usersCount: 5,
    renewalDate: "August 15, 2024",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Welcome, {clientData.companyName}!</h1>
        <p className="text-muted-foreground">Here's an overview of your account activity.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Megaphone className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientData.activeCampaigns}</div>
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
            <div className="text-2xl font-bold">{clientData.totalCallsThisMonth} / {clientData.callLimit}</div>
            <p className="text-xs text-muted-foreground">Usage this billing cycle</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Users</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientData.usersCount}</div>
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
            <div className="text-xl font-bold">{clientData.currentPlan}</div>
            <p className="text-xs text-muted-foreground">Renews on {clientData.renewalDate}</p>
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
            <CardDescription>Summary of your top campaigns.</CardDescription>
          </CardHeader>
          <CardContent>
            <Image
              src="https://placehold.co/600x300.png?text=Campaign+Chart"
              alt="Placeholder: Bar chart for campaign performance"
              width={600}
              height={300}
              className="rounded-md w-full"
              data-ai-hint="bar chart campaign"
            />
             <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href="/client-admin/campaigns">View All Campaigns</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><PieChart className="mr-2 h-5 w-5"/>Call Outcome Distribution</CardTitle>
             <CardDescription>Breakdown of call statuses for the current period.</CardDescription>
          </CardHeader>
          <CardContent>
            <Image
              src="https://placehold.co/600x300.png?text=Call+Status+Chart"
              alt="Placeholder: Pie chart for call outcomes"
              width={600}
              height={300}
              className="rounded-md w-full"
              data-ai-hint="pie chart status"
            />
             <Button variant="outline" className="mt-4 w-full" asChild>
                <Link href="/client-admin/campaigns"> {/* Or a specific reports page */}
                    View Detailed Reports
                </Link>
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
