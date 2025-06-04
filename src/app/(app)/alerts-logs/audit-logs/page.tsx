
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Filter, UserCircle, CalendarDays, Search } from "lucide-react";
import { format } from "date-fns";

export default function AuditLogsPage() {
  // Mock data for audit logs
  const auditLogs = [
    { id: 1, timestamp: new Date(), user: "admin@voxaiomni.com", action: "Updated Plan 'Basic Monthly'", details: "Price changed from $29 to $35" },
    { id: 2, timestamp: new Date(Date.now() - 3600000), user: "client_admin@innovate.com", action: "Created Campaign 'Summer Sale'", details: "Target: 1000 calls" },
    { id: 3, timestamp: new Date(Date.now() - 7200000), user: "system", action: "API Key Revoked", details: "Key ID: sk_live_...abc for Client 'Solutions Ltd'" },
    { id: 4, timestamp: new Date(Date.now() - 86400000), user: "support@voxaiomni.com", action: "Client Account 'Tech Ventures' Suspended", details: "Reason: Overdue payment" },
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Audit Logs</h1>
          <p className="text-muted-foreground">Track significant actions and changes within the system.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Audit Logs</CardTitle>
          <CardDescription>Search and filter logs by user, action, or date range.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-grow relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by action or details..." className="pl-10" />
          </div>
          <div className="flex-grow relative">
             <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Filter by User ID or Email" className="pl-10" />
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
          <CardTitle>Log Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{format(log.timestamp, "MMM dd, yyyy HH:mm:ss")}</TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {auditLogs.length === 0 && <p className="p-4 text-center text-muted-foreground">No audit logs found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
