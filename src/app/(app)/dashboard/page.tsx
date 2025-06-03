
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UsersRound, TrendingUp, Clock, Zap } from "lucide-react";
import Image from "next/image";

const statCardsData = [
  {
    title: "Active Calls",
    value: "24",
    change: "+12% from last month",
    icon: TrendingUp,
    changeColor: "text-green-600 dark:text-green-400",
  },
  {
    title: "Total Users",
    value: "1,247",
    change: "+8% from last month",
    icon: UsersRound,
    changeColor: "text-green-600 dark:text-green-400",
  },
  {
    title: "Avg Call Duration",
    value: "4:32",
    change: "-2% from last month",
    icon: Clock,
    changeColor: "text-red-600 dark:text-red-400",
  },
  {
    title: "Success Rate",
    value: "94.5%",
    change: "+5% from last month",
    icon: Zap,
    changeColor: "text-green-600 dark:text-green-400",
  },
];

const recentCallsData = [
  {
    name: "John Doe",
    agentInfo: "AI-Agent-01 • 5:30",
    status: "completed",
    timeAgo: "2 mins ago",
  },
  {
    name: "Sarah Wilson",
    agentInfo: "AI-Agent-02 • 3:45",
    status: "completed",
    timeAgo: "5 mins ago",
  },
  {
    name: "Mike Johnson",
    agentInfo: "AI-Agent-01 • 2:15",
    status: "failed",
    timeAgo: "8 mins ago",
  },
  {
    name: "Emily Brown",
    agentInfo: "AI-Agent-03 • 4:10",
    status: "completed",
    timeAgo: "12 mins ago",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
        {/* The paragraph below has been removed as its content is moved to the app header */}
        {/* <p className="text-muted-foreground">Manage your AI calling system</p> */}
      </div>

      <div>
        <h2 className="text-2xl font-semibold font-headline mb-1">Dashboard Overview</h2>
        <p className="text-muted-foreground mb-6">Real-time insights into your AI calling system performance</p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCardsData.map((card) => {
            const IconComponent = card.icon;
            return (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <IconComponent className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className={`text-xs ${card.changeColor}`}>{card.change}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Call Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Image
              src="https://placehold.co/600x300.png?text=Call+Activity+Chart"
              alt="Call Activity Chart Placeholder"
              width={600}
              height={300}
              className="rounded-md w-full"
              data-ai-hint="line chart"
            />
            {/* Y-axis labels for context, not functional chart */}
            <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                <span>60</span><span>45</span><span>30</span><span>15</span><span>0</span>
            </div>
             <div className="mt-1 text-xs text-muted-foreground flex justify-around">
                <span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentCallsData.map((call, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{call.name}</p>
                  <p className="text-xs text-muted-foreground">{call.agentInfo}</p>
                </div>
                <div className="text-right">
                  <Badge
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full
                      ${call.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100" : ""}
                      ${call.status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100" : ""}`}
                  >
                    {call.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-0.5">{call.timeAgo}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
