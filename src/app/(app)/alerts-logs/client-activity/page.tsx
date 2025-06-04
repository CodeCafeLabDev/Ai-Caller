
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Filter, UserCircle, Activity, CalendarDays, Search, FileText } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function ClientActivityFeedPage() {
  // Mock data for client activity
  const clientActivity = [
    { id: 1, timestamp: new Date(), client: "Innovate Corp", user: "alice@innovate.com", action: "Campaign 'Q4 Leads' Started", details: "1500 calls scheduled" },
    { id: 2, timestamp: new Date(Date.now() - 1800000), client: "Solutions Ltd", user: "bob@solutions.io", action: "AI Template 'Reminder Script' Updated", details: "Version 1.3" },
    { id: 3, timestamp: new Date(Date.now() - 3600000), client: "Innovate Corp", user: "john.doe@innovate.com", action: "User Login", details: "IP: 192.168.1.5" },
    { id: 4, timestamp: new Date(Date.now() - 7200000), client: "Tech Ventures", user: "carol@techventures.dev", action: "Report 'July Performance' Downloaded", details: "Format: PDF" },
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Client Activity Feed</h1>
          <p className="text-muted-foreground">Monitor real-time activities performed by client users.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Activity</CardTitle>
          <CardDescription>Search by client, user, action, or date.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-grow relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search Client, User, Action..." className="pl-10" />
          </div>
          <div className="flex-grow relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="date" placeholder="Filter by Date" className="pl-10" />
          </div>
          <Button><Filter className="mr-2 h-4 w-4" />Apply Filters</Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead><FileText className="inline-block mr-1 h-4 w-4" />Client</TableHead>
                <TableHead><UserCircle className="inline-block mr-1 h-4 w-4" />User</TableHead>
                <TableHead><Activity className="inline-block mr-1 h-4 w-4" />Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientActivity.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>{format(activity.timestamp, "MMM dd, yyyy HH:mm:ss")}</TableCell>
                  <TableCell>{activity.client}</TableCell>
                  <TableCell>{activity.user}</TableCell>
                  <TableCell className="font-medium">{activity.action}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{activity.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {clientActivity.length === 0 && <p className="p-4 text-center text-muted-foreground">No client activity found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
