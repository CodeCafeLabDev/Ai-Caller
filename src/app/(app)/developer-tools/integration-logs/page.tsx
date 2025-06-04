
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListChecks, Search, Filter, CalendarDays, FileDown } from "lucide-react";

export default function IntegrationLogsPage() {
  // Placeholder data
  const mockLogs = [
    { id: "log1", timestamp: "2024-07-21 10:00:00", client: "Innovate Corp", endpoint: "/campaigns", method: "POST", status: 201, duration: "120ms" },
    { id: "log2", timestamp: "2024-07-21 10:05:00", client: "Solutions Ltd", endpoint: "/calls/initiate", method: "POST", status: 401, duration: "50ms", error: "Unauthorized" },
    { id: "log3", timestamp: "2024-07-21 10:10:00", client: "Innovate Corp", endpoint: "/campaigns/camp_123", method: "GET", status: 200, duration: "80ms" },
  ];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <ListChecks className="mr-3 h-8 w-8 text-primary" /> API Integration Logs
          </h1>
          <p className="text-muted-foreground">
            Monitor and review all API interactions with the Voxaiomni platform.
          </p>
        </div>
        <Button variant="outline"><FileDown className="mr-2 h-4 w-4"/>Export Logs</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter API Logs</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by Client, Endpoint, Status..." className="pl-8 h-9"/>
          </div>
          <Input type="text" placeholder="Filter by Client ID" className="h-9"/>
          <Input type="text" placeholder="Filter by Endpoint" className="h-9"/>
          <Button variant="outline" className="h-9"><Filter className="mr-2 h-4 w-4"/>Apply Filters</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Call History</CardTitle>
          <CardDescription>Detailed log of incoming API requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Endpoint</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Error</th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {mockLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">{log.timestamp}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{log.client}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">{log.endpoint}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{log.method}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.status >= 400 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {log.status}
                        </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">{log.duration}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600">{log.error || "-"}</td>
                  </tr>
                ))}
                {mockLogs.length === 0 && (
                    <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">No logs found.</td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Placeholder for pagination */}
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm">Previous</Button>
            <Button variant="outline" size="sm" className="ml-2">Next</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    