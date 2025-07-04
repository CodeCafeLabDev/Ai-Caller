
"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/cn";
import { format } from "date-fns";
import { ShieldAlert, Bell, ServerCrash, AlertTriangle, MoreHorizontal, Filter, Users, Mail, MessageSquare } from "lucide-react";

type AlertSeverity = "Info" | "Warning" | "Critical";
type AlertStatus = "Open" | "Acknowledged" | "Resolved";

interface SystemAlert {
  id: string;
  timestamp: Date;
  alertType: string;
  severity: AlertSeverity;
  affectedModule: string;
  status: AlertStatus;
  assignedAdmin?: string;
  description: string;
  resolutionSummary?: string;
}

const mockAlertsData: SystemAlert[] = [
  { id: "alert_1", timestamp: new Date(Date.now() - 120000), alertType: "API Downtime", severity: "Critical", affectedModule: "Payment Gateway API", status: "Open", description: "Payment gateway API unresponsive. Multiple transaction failures.", resolutionSummary: "Investigating external provider outage." },
  { id: "alert_2", timestamp: new Date(Date.now() - 900000), alertType: "High Call Volume", severity: "Warning", affectedModule: "Call Engine", status: "Acknowledged", assignedAdmin: "ops_team", description: "Call volume exceeds 80% capacity for Campaign 'Q4 Leads'.", resolutionSummary: "Scaling resources, monitoring performance." },
  { id: "alert_3", timestamp: new Date(Date.now() - 3600000), alertType: "AI Model Update", severity: "Info", affectedModule: "AI Core", status: "Resolved", assignedAdmin: "dev_team", description: "New sentiment analysis model deployed successfully.", resolutionSummary: "Deployment confirmed, monitoring initial feedback." },
  { id: "alert_4", timestamp: new Date(Date.now() - 10800000), alertType: "Database Connection Failure", severity: "Critical", affectedModule: "Database Service", status: "Resolved", assignedAdmin: "db_admin", description: "Primary database connection lost. Failover initiated.", resolutionSummary: "Failover successful. Root cause identified as network glitch." },
  { id: "alert_5", timestamp: new Date(Date.now() - 86400000), alertType: "Low Intent Match Rate", severity: "Warning", affectedModule: "AI Processing", status: "Open", description: "Intent match rate for 'Support Bot' dropped below 60%.", resolutionSummary: "Reviewing recent script changes and user utterances." },
];

const severityColors: Record<AlertSeverity, string> = {
  Critical: "bg-red-100 text-red-700 border-red-300",
  Warning: "bg-yellow-100 text-yellow-700 border-yellow-300",
  Info: "bg-blue-100 text-blue-700 border-blue-300",
};

const statusColors: Record<AlertStatus, string> = {
  Open: "bg-orange-100 text-orange-700 border-orange-300",
  Acknowledged: "bg-purple-100 text-purple-700 border-purple-300",
  Resolved: "bg-green-100 text-green-700 border-green-300",
};

export default function SystemAlertsPage() {
  const { toast } = useToast();
  const [alerts, setAlerts] = React.useState<SystemAlert[]>(mockAlertsData);
  const [severityFilter, setSeverityFilter] = React.useState<AlertSeverity | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<AlertStatus | "all">("all");

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
    return matchesSeverity && matchesStatus;
  });

  const handleAlertAction = (action: string, alertId: string, newStatus?: AlertStatus) => {
    if (newStatus) {
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === alertId ? { ...alert, status: newStatus } : alert
        )
      );
    }
    toast({
      title: `Action: ${action}`,
      description: `Performed on alert ID: ${alertId}. (Simulated)`,
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">System Alerts Dashboard</h1>
          <p className="text-muted-foreground">Monitor critical system notifications, warnings, and operational status.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5" />Filter Alerts</CardTitle>
          <CardDescription>Refine the list of alerts by severity or status.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-1.5">
            <label htmlFor="severity-filter" className="text-sm font-medium">Severity</label>
            <Select value={severityFilter} onValueChange={(value) => setSeverityFilter(value as AlertSeverity | "all")}>
              <SelectTrigger id="severity-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="Warning">Warning</SelectItem>
                <SelectItem value="Info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1.5">
            <label htmlFor="status-filter" className="text-sm font-medium">Status</label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AlertStatus | "all")}>
              <SelectTrigger id="status-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Acknowledged">Acknowledged</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active System Alerts</CardTitle>
          <CardDescription>
            View important system events, errors, and warnings that require attention.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Alert Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Affected Module</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="min-w-[250px]">Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.length > 0 ? (
                  filteredAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>{format(alert.timestamp, "MMM dd, HH:mm:ss")}</TableCell>
                      <TableCell className="font-medium">{alert.alertType}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs", severityColors[alert.severity])}>{alert.severity}</Badge>
                      </TableCell>
                      <TableCell>{alert.affectedModule}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs", statusColors[alert.status])}>{alert.status}</Badge>
                      </TableCell>
                      <TableCell>{alert.assignedAdmin || "-"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-md truncate" title={alert.description}>
                        {alert.description}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Alert Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleAlertAction("View Details", alert.id)}>View Details</DropdownMenuItem>
                            {alert.status === "Open" && (
                              <DropdownMenuItem onClick={() => handleAlertAction("Acknowledge", alert.id, "Acknowledged")}>Acknowledge</DropdownMenuItem>
                            )}
                            {alert.status !== "Resolved" && (
                              <DropdownMenuItem onClick={() => handleAlertAction("Resolve", alert.id, "Resolved")}>Mark Resolved</DropdownMenuItem>
                            )}
                            <DropdownMenuItem disabled>Assign to User</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No system alerts matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Configuration & Future Enhancements</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
            <div>
                <h4 className="font-semibold text-foreground mb-1">Alert Channels (Planned)</h4>
                <p>Configure notifications to be sent via:</p>
                <ul className="list-disc list-inside pl-4 mt-1 space-y-0.5">
                    <li><Mail className="inline-block mr-1.5 h-3.5 w-3.5 text-gray-500"/>Email (to specified admin groups)</li>
                    <li><MessageSquare className="inline-block mr-1.5 h-3.5 w-3.5 text-gray-500"/>Slack (to designated channels)</li>
                    <li><Bell className="inline-block mr-1.5 h-3.5 w-3.5 text-gray-500"/>Web Push Notifications (in-app)</li>
                </ul>
            </div>
            <div>
                <h4 className="font-semibold text-foreground mb-1">Management Rules (Planned)</h4>
                <ul className="list-disc list-inside pl-4 mt-1 space-y-0.5">
                    <li>Auto-clear rules for informational alerts after a set period.</li>
                    <li>Manual dismissal workflows with audit trails.</li>
                    <li>Escalation policies for unresolved critical alerts.</li>
                </ul>
            </div>
             <div>
                <h4 className="font-semibold text-foreground mb-1">Alert Prioritization (Planned)</h4>
                <p>System will allow defining custom alert priorities and routing based on affected module and severity.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
