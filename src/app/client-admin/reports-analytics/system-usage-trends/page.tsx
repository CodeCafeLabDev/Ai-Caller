
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Users,
  Cpu,
  DollarSign,
  Languages,
  CalendarDays,
  Zap,
  Clock,
  BarChart3,
  AreaChart,
  PieChart,
} from "lucide-react";
import { useEffect, useState } from "react";
import elevenLabsApi from "@/lib/elevenlabsApi";
import { Calendar } from "@/components/ui/calendar";
import { addDays } from "date-fns";
import {
  ChartContainer,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, HelpCircle } from "lucide-react";
// Removed: import type { Metadata } from 'next';

// export const metadata: Metadata = {
//   title: 'System Usage Trends - AI Caller',
//   description: 'Monitor overall system performance, resource utilization, call volumes, and AI model costs over time.',
//   keywords: ['system usage', 'performance trends', 'resource utilization', 'call volume', 'ai costs', 'AI Caller analytics'],
// };

export default function SystemUsageTrendsPage() {
  // State for usage and conversation analytics
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [drillAgent, setDrillAgent] = useState<null | { agentId: string; agentName: string }>(null);
  const [drillConvs, setDrillConvs] = useState<any[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillError, setDrillError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(reportData.length / rowsPerPage);
  const paginatedData = reportData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Helper for color coding success rate
  function getSuccessColor(rate: number) {
    if (rate >= 80) return "text-green-600 font-bold";
    if (rate >= 50) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  }

  useEffect(() => {
    async function fetchAnalytics() {
      if (!dateRange.from || !dateRange.to) return;
      setLoading(true);
      setError(null);
      try {
        const start = dateRange.from.getTime();
        const end = dateRange.to.getTime();
        // 1. Fetch usage stats breakdown by agent
        const usageRes = await elevenLabsApi.getUsageStats({
          start_unix: start,
          end_unix: end,
          breakdown_type: "agent",
          aggregation_interval: "cumulative",
        });
        const usageJson = await usageRes.json();
        const agentIds = Object.keys(usageJson.usage || {});
        // 2. Fetch agent details for mapping
        const agentDetailsArr = await Promise.all(
          agentIds.map(async (agentId) => {
            try {
              const res = await elevenLabsApi.getAgent(agentId);
              const data = await res.json();
              return { agentId, agentName: data.name || agentId, clientName: data.client_name || data.client || "(unknown)" };
            } catch {
              return { agentId, agentName: agentId, clientName: "(unknown)" };
            }
          })
        );
        const agentDetailsMap = Object.fromEntries(agentDetailsArr.map(a => [a.agentId, a]));
        // 3. For each agent, fetch conversations
        const allAgentData = await Promise.all(
          agentIds.map(async (agentId) => {
            const convRes = await elevenLabsApi.listConversations({ agent_id: agentId, page_size: 100 });
            const convJson = await convRes.json();
            const conversations = convJson.conversations || [];
            const totalCalls = conversations.length;
            const totalDuration = conversations.reduce((sum: any, c: any) => sum + (c.call_duration_secs || 0), 0);
            const successCount = conversations.filter((c: any) => c.call_successful === "success").length;
            const successRate = totalCalls > 0 ? Math.round((successCount / totalCalls) * 100) : 0;
            const agentInfo = agentDetailsMap[agentId] || { agentName: agentId, clientName: "(unknown)" };
            return {
              agentId,
              agentName: agentInfo.agentName,
              clientName: agentInfo.clientName,
              totalUsage: usageJson.usage[agentId]?.[0] || 0,
              totalCalls,
              totalDuration,
              successRate,
            };
          })
        );
        setReportData(allAgentData);
      } catch (err) {
        setError((err as any).message || "Failed to fetch analytics");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [dateRange]);

  const handleRowClick = useCallback(async (row: any) => {
    setDrillAgent({ agentId: row.agentId, agentName: row.agentName });
    setDrillLoading(true);
    setDrillError(null);
    try {
      const convRes = await elevenLabsApi.listConversations({ agent_id: row.agentId, page_size: 100 });
      const convJson = await convRes.json();
      setDrillConvs(convJson.conversations || []);
    } catch (err: any) {
      setDrillError(err.message || "Failed to fetch conversations");
      setDrillConvs([]);
    } finally {
      setDrillLoading(false);
    }
  }, []);

  const closeDrill = () => {
    setDrillAgent(null);
    setDrillConvs([]);
    setDrillError(null);
    setDrillLoading(false);
  };

  // CSV Export utility
  function exportToCSV() {
    if (!reportData.length) return;
    const headers = [
      "Client Name",
      "Agent Name",
      "Total Usage",
      "# of Calls",
      "Total Duration (s)",
      "Success Rate (%)"
    ];
    const rows = reportData.map(row => [
      row.clientName,
      row.agentName,
      row.totalUsage,
      row.totalCalls,
      row.totalDuration,
      row.successRate
    ]);
    const csvContent = [headers, ...rows]
      .map(e => e.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `agent-analytics-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Date Range Picker */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Select Date Range</CardTitle>
          <CardDescription>Pick a start and end date for the analytics report.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range) => setDateRange(range as any)}
              numberOfMonths={2}
              max={60}
            />
            <div className="ml-4">
              <div className="font-medium">Selected Range:</div>
              <div>
                {dateRange.from && dateRange.to
                  ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                  : "Please select a start and end date."}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Total Usage by Agent</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ChartContainer config={{ usage: { label: "Total Usage", color: "#6366f1" } }}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={reportData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agentName" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalUsage" fill="#6366f1" name="Total Usage" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        {/* Calls Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Total Calls by Agent</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ChartContainer config={{ calls: { label: "Total Calls", color: "#10b981" } }}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={reportData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agentName" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalCalls" fill="#10b981" name="Total Calls" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        {/* Success Rate Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Success Rate by Agent (%)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ChartContainer config={{ success: { label: "Success Rate", color: "#f59e42" } }}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={reportData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agentName" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="successRate" fill="#f59e42" name="Success Rate" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <LineChart className="mr-3 h-8 w-8 text-primary" /> System Usage Trends
        </h1>
        <p className="text-muted-foreground">
          Monitor overall system performance and resource utilization over time.
        </p>
      </div>

      {/* ElevenLabs Usage & Agent Analytics */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle>Client & Agent Usage Analytics (ElevenLabs)</CardTitle>
            <CardDescription>Detailed usage and call stats for all agents (selected period)</CardDescription>
          </div>
          <Button onClick={exportToCSV} disabled={loading} variant="outline">
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading analytics...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-2 py-1 border" title="The client organization this agent belongs to.">Client Name</th>
                    <th className="px-2 py-1 border" title="The AI agent's display name.">Agent Name</th>
                    <th className="px-2 py-1 border" title="Total characters used by this agent.">Total Usage</th>
                    <th className="px-2 py-1 border" title="Number of calls handled by this agent."># of Calls</th>
                    <th className="px-2 py-1 border" title="Sum of all call durations for this agent.">Total Duration (s)</th>
                    <th className="px-2 py-1 border" title="Percentage of successful calls.">Success Rate (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, i) => (
                    <tr key={row.agentId || i} className="cursor-pointer hover:bg-accent" onClick={() => handleRowClick(row)}>
                      <td className="px-2 py-1 border max-w-[140px] truncate" title={row.clientName}>{row.clientName}</td>
                      <td className="px-2 py-1 border max-w-[140px] truncate" title={row.agentName}>{row.agentName}</td>
                      <td className="px-2 py-1 border">{row.totalUsage}</td>
                      <td className="px-2 py-1 border">{row.totalCalls}</td>
                      <td className="px-2 py-1 border">{row.totalDuration}</td>
                      <td className={`px-2 py-1 border ${getSuccessColor(row.successRate)}`}>{row.successRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex justify-end items-center gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                <span>Page {page} of {totalPages}</span>
                <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Drill-down Modal for Agent Conversations */}
      <Dialog open={!!drillAgent} onOpenChange={closeDrill}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Conversations for {drillAgent?.agentName}</DialogTitle>
            <DialogDescription>All conversations for this agent in the selected period.</DialogDescription>
          </DialogHeader>
          {drillLoading ? (
            <div>Loading conversations...</div>
          ) : drillError ? (
            <div className="text-red-500">{drillError}</div>
          ) : (
            <div className="overflow-x-auto max-h-[400px]">
              <table className="min-w-full text-xs border">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-2 py-1 border">Start Time</th>
                    <th className="px-2 py-1 border">Duration (s)</th>
                    <th className="px-2 py-1 border">Status</th>
                    <th className="px-2 py-1 border">Transcript Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {drillConvs.map((conv, i) => (
                    <tr key={conv.conversation_id || i}>
                      <td className="px-2 py-1 border">{conv.start_time_unix_secs ? new Date(conv.start_time_unix_secs * 1000).toLocaleString() : "-"}</td>
                      <td className="px-2 py-1 border">{conv.call_duration_secs ?? "-"}</td>
                      <td className="px-2 py-1 border">
                        <span title={
                          conv.call_successful === "success"
                            ? "Success"
                            : conv.call_successful === "failure"
                            ? "Failure"
                            : "Unknown"
                        }>
                          {conv.call_successful === "success" ? (
                            <CheckCircle className="inline h-4 w-4 text-green-600 mr-1" />
                          ) : conv.call_successful === "failure" ? (
                            <XCircle className="inline h-4 w-4 text-red-600 mr-1" />
                          ) : (
                            <HelpCircle className="inline h-4 w-4 text-gray-400 mr-1" />
                          )}
                          {conv.call_successful.charAt(0).toUpperCase() + conv.call_successful.slice(1)}
                        </span>
                      </td>
                      <td className="px-2 py-1 border max-w-xs truncate" title={conv.transcript_summary}>{conv.transcript_summary || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {drillConvs.length === 0 && <div className="text-center text-muted-foreground py-4">No conversations found.</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center"><AreaChart className="mr-2 h-5 w-5" />Total Calls Over Time</CardTitle>
            <CardDescription>Daily/Weekly/Monthly call volumes.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ChartContainer config={{ calls: { label: "Total Calls", color: "#10b981" } }}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={reportData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agentName" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalCalls" fill="#10b981" name="Total Calls" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Clock className="mr-2 h-5 w-5" />Avg. Call Duration Over Time</CardTitle>
            <CardDescription>Track average call length trends.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ChartContainer config={{ duration: { label: "Avg. Call Duration", color: "#f59e42" } }}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={reportData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agentName" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalDuration" fill="#f59e42" name="Avg. Call Duration" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Zap className="mr-2 h-5 w-5" />Active Campaigns Over Time</CardTitle>
            <CardDescription>Number of active campaigns.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ChartContainer config={{ campaigns: { label: "Active Campaigns", color: "#6366f1" } }}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={reportData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agentName" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalCalls" fill="#6366f1" name="Active Campaigns" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5" />Top 5 Clients by Call Volume</CardTitle>
            <CardDescription>Identify your most active clients.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ChartContainer config={{ clients: { label: "Top Clients", color: "#10b981" } }}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={reportData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="clientName" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalCalls" fill="#10b981" name="Top Clients" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Cpu className="mr-2 h-5 w-5" />Speech-to-Text/Text-to-Speech Usage</CardTitle>
            <CardDescription>Minutes or characters processed for STT/TTS services.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ChartContainer config={{ stt: { label: "STT/TTS Usage", color: "#f59e42" } }}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={reportData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agentName" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalUsage" fill="#f59e42" name="STT/TTS Usage" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Languages className="mr-2 h-5 w-5" />Language Distribution</CardTitle>
            <CardDescription>Breakdown of calls by language used.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ChartContainer config={{ language: { label: "Language Distribution", color: "#6366f1" } }}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={reportData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agentName" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalCalls" fill="#6366f1" name="Language Distribution" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><DollarSign className="mr-2 h-5 w-5" />AI Model Cost Analysis</CardTitle>
            <CardDescription>Estimated costs associated with AI model usage (e.g., OpenAI).</CardDescription>
          </CardHeader>
          <CardContent>
            
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center"><CalendarDays className="mr-2 h-5 w-5" />Call Activity Heat Map</CardTitle>
            <CardDescription>Visual representation of call density by hour of the day and day of the week.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ChartContainer config={{ heatmap: { label: "Call Activity Heat Map", color: "#10b981" } }}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={reportData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agentName" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalCalls" fill="#10b981" name="Call Activity Heat Map" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
