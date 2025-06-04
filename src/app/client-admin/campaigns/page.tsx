
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, PlusCircle, ListFilter, BarChart3, MoreHorizontal, Play, Pause, Edit } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data for client campaigns
const mockClientCampaigns = [
  { id: "camp_c1_01", name: "Q4 Lead Generation", status: "Active", callsMade: 450, callsTarget: 500, successRate: "90%", lastRun: "2024-07-28" },
  { id: "camp_c1_02", name: "Customer Feedback July", status: "Completed", callsMade: 200, callsTarget: 200, successRate: "95%", lastRun: "2024-07-15" },
  { id: "camp_c1_03", name: "New Product Teaser", status: "Paused", callsMade: 50, callsTarget: 300, successRate: "N/A", lastRun: "2024-07-20" },
];

const statusVariants = {
  Active: "bg-green-100 text-green-700",
  Paused: "bg-yellow-100 text-yellow-700",
  Completed: "bg-blue-100 text-blue-700",
};


export default function ClientCampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <Megaphone className="mr-2 h-7 w-7" /> My Campaigns
          </h1>
          <p className="text-muted-foreground">Manage and monitor your calling campaigns.</p>
        </div>
        <Button size="lg" onClick={() => alert("Navigate to create campaign page (for client)")}>
          <PlusCircle className="mr-2 h-5 w-5" /> Create New Campaign
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign List</CardTitle>
          <CardDescription>View, edit, and manage your campaigns.</CardDescription>
           <div className="flex flex-col md:flex-row items-center gap-4 pt-4">
            <Input placeholder="Search campaigns..." className="max-w-sm h-9" />
            <Select defaultValue="all">
                <SelectTrigger className="w-full md:w-[180px] h-9">
                <ListFilter className="mr-2 h-4 w-4" />
                <SelectValue />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Paused">Paused</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress (Made/Target)</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockClientCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${statusVariants[campaign.status as keyof typeof statusVariants]}`}>{campaign.status}</Badge>
                  </TableCell>
                  <TableCell>{campaign.callsMade} / {campaign.callsTarget}</TableCell>
                  <TableCell>{campaign.successRate}</TableCell>
                  <TableCell>{campaign.lastRun}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => alert(`View details for ${campaign.name}`)}>
                          <BarChart3 className="mr-2 h-4 w-4" /> View Stats
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => alert(`Edit ${campaign.name}`)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Campaign
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => alert(campaign.status === 'Active' ? `Pause ${campaign.name}` : `Resume ${campaign.name}`)}>
                          {campaign.status === 'Active' ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                          {campaign.status === 'Active' ? "Pause" : "Resume"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
