
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Bell, ServerCrash, ShieldAlert } from "lucide-react";

export default function SystemAlertsPage() {
  // Mock data for system alerts
  const alerts = [
    { id: 1, type: "Critical", message: "Payment gateway API unresponsive.", time: "2 mins ago", icon: ServerCrash, color: "text-red-500" },
    { id: 2, type: "Warning", message: "High call volume detected on Campaign 'Q4 Leads'.", time: "15 mins ago", icon: AlertTriangle, color: "text-yellow-500" },
    { id: 3, type: "Info", message: "AI model updated successfully.", time: "1 hour ago", icon: Bell, color: "text-blue-500" },
    { id: 4, type: "Critical", message: "Database connection failed. Retrying...", time: "3 hours ago", icon: ServerCrash, color: "text-red-500" },
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">System Alerts</h1>
          <p className="text-muted-foreground">Monitor critical system notifications and warnings.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent System Alerts</CardTitle>
          <CardDescription>
            View important system events, errors, and warnings that require attention.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {alerts.length > 0 ? (
            alerts.map((alert) => {
              const IconComponent = alert.icon;
              return (
                <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-md shadow-sm hover:shadow-md transition-shadow">
                  <IconComponent className={`h-6 w-6 mt-1 ${alert.color}`} />
                  <div>
                    <p className={`font-semibold ${alert.color}`}>{alert.type}: <span className="text-foreground font-normal">{alert.message}</span></p>
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground">No system alerts at the moment.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Future Enhancements</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
            <p> - Real-time alert notifications (in-app and email/SMS).</p>
            <p> - Filtering alerts by severity (Critical, Warning, Info).</p>
            <p> - Acknowledging and resolving alerts.</p>
            <p> - Detailed alert history and search functionality.</p>
        </CardContent>
      </Card>
    </div>
  );
}
