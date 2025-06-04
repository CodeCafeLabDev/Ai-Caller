
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, Filter, UserCircle, MapPin, CalendarDays, Search, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function LoginHistoryPage() {
  // Mock data for login history
  const loginHistory = [
    { id: 1, timestamp: new Date(), user: "admin@voxaiomni.com", ipAddress: "192.168.1.100", location: "New York, USA", status: "Success" },
    { id: 2, timestamp: new Date(Date.now() - 3600000), user: "client_admin@innovate.com", ipAddress: "10.0.0.5", location: "London, UK", status: "Success" },
    { id: 3, timestamp: new Date(Date.now() - 7200000), user: "unknown_user", ipAddress: "203.0.113.45", location: "Unknown", status: "Failed" },
    { id: 4, timestamp: new Date(Date.now() - 86400000), user: "admin@voxaiomni.com", ipAddress: "192.168.1.100", location: "New York, USA", status: "Success" },
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3">
        <History className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Login History</h1>
          <p className="text-muted-foreground">Review login attempts and access patterns for all users.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Login History</CardTitle>
          <CardDescription>Search logs by user, IP, location, date, or status.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-grow relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search User, IP, Location..." className="pl-10" />
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
          <CardTitle>Recent Logins</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead><UserCircle className="inline-block mr-1 h-4 w-4" />User</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead><MapPin className="inline-block mr-1 h-4 w-4" />Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loginHistory.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{format(log.timestamp, "MMM dd, yyyy HH:mm:ss")}</TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell className="font-mono text-xs">{log.ipAddress}</TableCell>
                  <TableCell>{log.location}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === "Success" ? "default" : "destructive"} className={`flex items-center gap-1 w-fit ${log.status === "Success" ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {log.status === "Success" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {log.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {loginHistory.length === 0 && <p className="p-4 text-center text-muted-foreground">No login history found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
