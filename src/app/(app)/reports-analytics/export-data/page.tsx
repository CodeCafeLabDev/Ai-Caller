
"use client"; // Add this directive

import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, CalendarRange, ListFilter } from "lucide-react";
import { useToast } from '@/hooks/use-toast'; // Import useToast

// Since this is now a Client Component, metadata should be handled by the nearest parent Server Component (e.g., layout.tsx or page.tsx at a higher level if this were a child component).
// For a top-level page like this, metadata export here might not be picked up as expected for Client Components.
// We'll comment it out for now, assuming it would be handled by a server-side layout or if this component were refactored.
// export const metadata: Metadata = {
//   title: 'Export Data | Reports & Analytics - Voxaiomni',
//   description: 'Export various types of data, including call logs, campaign performance, and client information, in CSV or PDF formats.',
//   keywords: ['export data', 'csv export', 'pdf export', 'data download', 'voxaiomni reports', 'admin panel'],
// };

export default function ExportDataPage() {
  const { toast } = useToast(); // Initialize toast

  const handleExport = (dataType: string, format: string) => {
    toast({ // Use the toast hook
        title: "Export Initiated (Simulated)",
        description: `Simulating export of ${dataType} as ${format}.`,
    });
    // Here you would implement the actual data fetching and file generation/download logic.
    console.log(`Simulating export of ${dataType} as ${format}.`);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center">
            <Download className="mr-3 h-8 w-8 text-primary"/> Export Data
        </h1>
        <p className="text-muted-foreground">
          Download comprehensive datasets for offline analysis, reporting, or backup purposes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Data to Export</CardTitle>
          <CardDescription>Choose the type of data and format you wish to export.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Call Logs Export */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center"><FileText className="mr-2 h-5 w-5"/>Call Logs</CardTitle>
                <CardDescription>Detailed records of all calls.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                    <CalendarRange className="h-4 w-4 text-muted-foreground"/>
                    <span className="text-sm">Filter by date range (mock)</span>
                </div>
                <div className="flex items-center space-x-2">
                    <ListFilter className="h-4 w-4 text-muted-foreground"/>
                    <span className="text-sm">Apply other filters (mock)</span>
                </div>
                <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => handleExport("Call Logs", "CSV")}>Export CSV</Button>
                    <Button variant="outline" onClick={() => handleExport("Call Logs", "PDF")} disabled>Export PDF (Soon)</Button>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Performance Export */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center"><FileText className="mr-2 h-5 w-5"/>Campaign Performance</CardTitle>
                <CardDescription>Metrics and results for campaigns.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                 <div className="flex items-center space-x-2">
                    <CalendarRange className="h-4 w-4 text-muted-foreground"/>
                    <span className="text-sm">Select campaign(s) (mock)</span>
                </div>
                <div className="flex items-center space-x-2">
                    <ListFilter className="h-4 w-4 text-muted-foreground"/>
                    <span className="text-sm">Filter by status (mock)</span>
                </div>
                <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => handleExport("Campaign Performance", "CSV")}>Export CSV</Button>
                    <Button variant="outline" onClick={() => handleExport("Campaign Performance", "PDF")} disabled>Export PDF (Soon)</Button>
                </div>
              </CardContent>
            </Card>
            
             {/* Client Information Export */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center"><FileText className="mr-2 h-5 w-5"/>Client Information</CardTitle>
                <CardDescription>List of clients and their details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                 <div className="flex items-center space-x-2">
                    <ListFilter className="h-4 w-4 text-muted-foreground"/>
                    <span className="text-sm">Filter by plan or status (mock)</span>
                </div>
                <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => handleExport("Client Information", "CSV")}>Export CSV</Button>
                    <Button variant="outline" onClick={() => handleExport("Client Information", "PDF")} disabled>Export PDF (Soon)</Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Audit Logs Export */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center"><FileText className="mr-2 h-5 w-5"/>Audit Logs</CardTitle>
                <CardDescription>System and user activity logs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                    <CalendarRange className="h-4 w-4 text-muted-foreground"/>
                    <span className="text-sm">Filter by date range (mock)</span>
                </div>
                <div className="flex items-center space-x-2">
                    <ListFilter className="h-4 w-4 text-muted-foreground"/>
                    <span className="text-sm">Filter by action type (mock)</span>
                </div>
                <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => handleExport("Audit Logs", "CSV")}>Export CSV</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Export History (Placeholder)</CardTitle>
          <CardDescription>Track your recent data exports.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">A table listing previous exports with date, type, format, and status will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
