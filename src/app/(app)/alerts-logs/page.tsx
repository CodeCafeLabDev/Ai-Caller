
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, FileText, History, Users, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Alerts & Logs Overview | Admin - AI Caller',
  description: 'Central hub for monitoring system alerts, audit trails, login history, and user activities within AI Caller.',
  keywords: ['alerts', 'logs', 'audit trail', 'login history', 'activity feed', 'system monitoring', 'AI Caller admin'],
};

export default function AlertsLogsOverviewPage() {
  const sections = [
    { title: "System Alerts", description: "Monitor critical system notifications and warnings.", href: "/alerts-logs/system-alerts", icon: ShieldAlert },
    { title: "Audit Logs", description: "Track significant actions and changes within the system.", href: "/alerts-logs/audit-logs", icon: FileText },
    { title: "Login History", description: "Review login attempts and access patterns.", href: "/alerts-logs/login-history", icon: History },
    { title: "Client Activity Feed", description: "Monitor real-time activities by client users.", href: "/alerts-logs/client-activity", icon: Users },
  ];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-4xl font-bold font-headline">Alerts & Logs Center</h1>
          <p className="text-xl text-muted-foreground">
            Central hub for monitoring system alerts, audit trails, and user activities.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {sections.map((section) => {
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
                    View {section.title} <ArrowRight className="ml-2 h-4 w-4" />
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
            <p>This section provides comprehensive logging and alert capabilities to ensure system stability, security, and transparency.</p>
            <p>Utilize the sub-sections to investigate issues, monitor user behavior, and maintain an audit trail of important system events.</p>
        </CardContent>
      </Card>
    </div>
  );
}
