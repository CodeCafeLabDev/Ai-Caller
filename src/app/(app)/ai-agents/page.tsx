
"use client";

import Link from "next/link"; 
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
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Search,
  ListFilter,
  MoreHorizontal,
  Eye,
  Edit2,
  Archive,
  Copy,
  PlusCircle, 
  Check,
  ChevronsUpDown,
  FileText,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/cn";
import type { Metadata } from 'next';
import { useUser } from '@/lib/utils';
import { api } from '@/lib/apiConfig';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useRouter } from 'next/navigation';

// export const metadata: Metadata = {
//   title: 'AI Script Agents - AI Caller',
//   description: 'Manage global AI conversation agents for various use cases and languages.',
//   keywords: ['ai agents', 'script agents', 'conversation flow', 'bot scripts', 'AI Caller'],
// };

export type AIAgentStatus = "Draft" | "Published" | "Archived";
export type AIAgentUseCase = "Sales" | "Reminder" | "Feedback" | "Support" | "Lead Generation" | "Payment Collection" | "Survey" | "Other";
export type AIAgentLanguage = "English (US)" | "Spanish (ES)" | "French (FR)" | "German (DE)" | "Hindi (IN)" | "Other";


export type AIAgent = {
  id: string;
  name: string;
  useCase: AIAgentUseCase;
  tags: string[];
  createdBy: string; 
  language: AIAgentLanguage;
  lastModified: string; 
  status: AIAgentStatus;
  version: string;
  source: 'local' | 'elevenlabs';
  clientName?: string;
};



const statusVariants: Record<AIAgentStatus, string> = {
  Published: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
  Draft: "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100",
  Archived: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100",
};

const useCaseOptions: {value: AIAgentUseCase | "all"; label: string}[] = [
    {value: "all", label: "All Use Cases"},
    {value: "Lead Generation", label: "Lead Generation"},
    {value: "Reminder", label: "Reminder"},
    {value: "Feedback", label: "Feedback Collection"},
    {value: "Support", label: "Customer Support"},
    {value: "Sales", label: "Sales Call"},
    {value: "Payment Collection", label: "Payment Collection"},
    {value: "Survey", label: "Survey"},
    {value: "Other", label: "Other"},
];

const languageOptions: {value: AIAgentLanguage | "all"; label: string}[] = [
    {value: "all", label: "All Languages"},
    {value: "English (US)", label: "English (US)"},
    {value: "Spanish (ES)", label: "Spanish (ES)"},
    {value: "French (FR)", label: "French (FR)"},
    {value: "German (DE)", label: "German (DE)"},
    {value: "Hindi (IN)", label: "Hindi (IN)"},
    {value: "Other", label: "Other"},
];

const statusFilterOptions: {value: AIAgentStatus | "all"; label: string}[] = [
    {value: "all", label: "All Statuses"},
    {value: "Published", label: "Published"},
    {value: "Draft", label: "Draft"},
    {value: "Archived", label: "Archived"},
];


export default function AiAgentsPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const router = useRouter();
  const [agents, setAgents] = React.useState<AIAgent[]>([]);
  const [clients, setClients] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [useCaseFilter, setUseCaseFilter] = React.useState<AIAgentUseCase | "all">("all");
  const [languageFilter, setLanguageFilter] = React.useState<AIAgentLanguage | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<AIAgentStatus | "all">("all");

  const [useCaseComboboxOpen, setUseCaseComboboxOpen] = React.useState(false);
  const [languageComboboxOpen, setLanguageComboboxOpen] = React.useState(false);
  const [statusComboboxOpen, setStatusComboboxOpen] = React.useState(false);

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const [viewAgent, setViewAgent] = React.useState<any | null>(null);
  const [viewModalOpen, setViewModalOpen] = React.useState(false);

  // Helper to refresh agents
  const refreshAgents = React.useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/agents').then(res => res.json()),
      fetch('https://api.elevenlabs.io/v1/convai/agents', {
        headers: {
          'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json',
        }
      }).then(res => res.json()),
      api.getClients().then(res => res.json())
    ])
      .then(([localData, elevenData, clientsData]) => {
        let localAgents: AIAgent[] = [];
        let allClients: any[] = Array.isArray(clientsData.data) ? clientsData.data : [];
        setClients(allClients);
        if (Array.isArray(localData.data)) {
          localAgents = localData.data.map((agent: any) => {
            const client = allClients.find((c: any) => String(c.id) === String(agent.client_id));
            return {
              id: agent.agent_id,
              name: agent.name,
              useCase: agent.description || 'Other',
              tags: agent.tags ? JSON.parse(agent.tags) : [],
              createdBy: agent.creator_name || user?.name || user?.fullName || user?.email || 'Unknown',
              clientName: client ? client.companyName : '-',
              language: '',
              lastModified: agent.updated_at,
              status: 'Published',
              version: agent.model || '1.0',
              source: 'local',
            };
          });
        }
        let elevenLabsAgents: AIAgent[] = [];
        let agentsArr = [];
        if (Array.isArray(elevenData.agents)) agentsArr = elevenData.agents;
        else if (Array.isArray(elevenData.items)) agentsArr = elevenData.items;
        else if (Array.isArray(elevenData.data)) agentsArr = elevenData.data;
        else if (Array.isArray(elevenData)) agentsArr = elevenData;
        elevenLabsAgents = agentsArr.map((agent: any) => ({
          id: agent.agent_id || agent.id,
          name: agent.name,
          useCase: agent.description || 'Other',
          tags: agent.tags || [],
          createdBy: 'ElevenLabs',
          clientName: '-',
          language: '',
          lastModified: agent.updated_at || agent.last_modified,
          status: 'Published',
          version: agent.model || '1.0',
          source: 'elevenlabs',
        }));
        const merged = [...localAgents, ...elevenLabsAgents.filter(ea => !localAgents.some(la => la.id === ea.id))];
        setAgents(merged);
      })
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  }, [user]);

  React.useEffect(() => {
    refreshAgents();
  }, [refreshAgents]);

  // Replace handleAgentAction with real handlers
  const handleView = async (agent: any) => {
    // Fetch full details from backend
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}/details`);
      const data = await res.json();
      setViewAgent({ ...agent, details: data });
      setViewModalOpen(true);
    } catch {
      toast({ title: 'Failed to load agent details', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (agent: any) => {
    router.push(`/ai-agents/create/details/${agent.id}`);
  };
  const handleDuplicate = async (agent: any) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}/duplicate`, { 
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: user?.clientId || null
        }),
        credentials: 'include' 
      });
      if (res.ok) {
        toast({ title: 'Agent duplicated!' });
        refreshAgents();
      } else {
        toast({ title: 'Failed to duplicate agent', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (agent: any) => {
    if (!window.confirm('Are you sure you want to delete this agent? This cannot be undone.')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        toast({ title: 'Agent deleted!' });
        refreshAgents();
      } else {
        toast({ title: 'Failed to delete agent', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter((agent) => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const matchesSearch =
      agent.name.toLowerCase().includes(lowerSearchTerm) ||
      agent.useCase.toLowerCase().includes(lowerSearchTerm) ||
      agent.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm));

    const matchesUseCase = useCaseFilter === "all" || agent.useCase === useCaseFilter;
    const matchesLanguage = languageFilter === "all" || agent.language === languageFilter;
    const matchesStatus = statusFilter === "all" || agent.status === statusFilter;
    
    return matchesSearch && matchesUseCase && matchesLanguage && matchesStatus;
  });

  const totalPages = Math.ceil(filteredAgents.length / itemsPerPage);
  const paginatedAgents = filteredAgents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">AI Script Agents</h1>
          <p className="text-muted-foreground">Manage global AI conversation agents.</p>
        </div>
        <Button size="lg" asChild>
            <Link href="/ai-agents/create">
                <PlusCircle className="mr-2 h-5 w-5" />
                Create New Agent
            </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b p-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-grow w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search Name, Use Case, Tags..."
                className="pl-10 w-full bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap w-full md:w-auto justify-start items-center">
                <Popover open={useCaseComboboxOpen} onOpenChange={setUseCaseComboboxOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full sm:w-auto md:w-[180px] justify-between">
                            <ListFilter className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            {useCaseOptions.find(uc => uc.value === useCaseFilter)?.label || "Filter by Use Case"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command><CommandInput placeholder="Search use case..." /><CommandList><CommandEmpty>No use case.</CommandEmpty><CommandGroup>
                        {useCaseOptions.map(opt => (<CommandItem key={opt.value} value={opt.label} onSelect={() => { setUseCaseFilter(opt.value); setUseCaseComboboxOpen(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", useCaseFilter === opt.value ? "opacity-100" : "opacity-0")} />{opt.label}
                        </CommandItem>))}
                        </CommandGroup></CommandList></Command>
                    </PopoverContent>
                </Popover>

                 <Popover open={languageComboboxOpen} onOpenChange={setLanguageComboboxOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full sm:w-auto md:w-[180px] justify-between">
                            <FileText className="mr-2 h-4 w-4 shrink-0 opacity-50" /> {}
                            {languageOptions.find(lang => lang.value === languageFilter)?.label || "Filter by Language"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command><CommandInput placeholder="Search language..." /><CommandList><CommandEmpty>No language.</CommandEmpty><CommandGroup>
                        {languageOptions.map(opt => (<CommandItem key={opt.value} value={opt.label} onSelect={() => { setLanguageFilter(opt.value); setLanguageComboboxOpen(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", languageFilter === opt.value ? "opacity-100" : "opacity-0")} />{opt.label}
                        </CommandItem>))}
                        </CommandGroup></CommandList></Command>
                    </PopoverContent>
                </Popover>

                <Popover open={statusComboboxOpen} onOpenChange={setStatusComboboxOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full sm:w-auto md:w-[180px] justify-between">
                            <ListFilter className="mr-2 h-4 w-4 shrink-0 opacity-50" /> {}
                            {statusFilterOptions.find(st => st.value === statusFilter)?.label || "Filter by Status"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command><CommandInput placeholder="Search status..." /><CommandList><CommandEmpty>No status.</CommandEmpty><CommandGroup>
                        {statusFilterOptions.map(opt => (<CommandItem key={opt.value} value={opt.label} onSelect={() => { setStatusFilter(opt.value); setStatusComboboxOpen(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", statusFilter === opt.value ? "opacity-100" : "opacity-0")} />{opt.label}
                        </CommandItem>))}
                        </CommandGroup></CommandList></Command>
                    </PopoverContent>
                </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading agents...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent Name</TableHead>
                  <TableHead>Use Case</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAgents.length > 0 ? paginatedAgents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">
                      <Link href={`/ai-agents/create/details/${agent.id}`} className="text-blue-600 hover:underline">
                        {agent.name}
                      </Link>
                      <div className="flex flex-wrap gap-1 mt-1">
                          {agent.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell>{agent.useCase}</TableCell>
                    <TableCell>{agent.clientName || '-'}</TableCell>
                    <TableCell>{agent.createdBy}</TableCell>
                    <TableCell>{agent.lastModified ? new Date(agent.lastModified).toLocaleDateString() : ''}</TableCell>
                    <TableCell>
                      {agent.source === 'local' ? (
                        <Select
                          value={agent.status}
                          onValueChange={async (newStatus) => {
                            await fetch(`/api/agents/${agent.id}/status`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: newStatus }),
                            });
                            setAgents(prev =>
                              prev.map(a => a.id === agent.id ? { ...a, status: newStatus as AIAgentStatus } : a)
                            );
                            toast({ title: "Status updated", description: `Agent status set to ${newStatus}` });
                          }}
                        >
                          <SelectTrigger
                            className={cn(
                              "rounded-full px-2 py-0 text-xs font-semibold border-none shadow-none h-5 min-h-0 focus:ring-2 focus:ring-offset-2 focus:ring-green-200 text-center whitespace-nowrap overflow-visible",
                              statusVariants[agent.status]
                            )}
                            style={{ minWidth: 70, maxWidth: 110, justifyContent: "center", height: 20, lineHeight: '16px' }}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="p-0 min-w-[70px] max-w-[110px]">
                            <SelectItem value="Published">
                              <span className={cn("rounded-full px-2 py-0 text-xs font-semibold h-5 min-h-0 text-center whitespace-nowrap overflow-visible", statusVariants.Published)} style={{lineHeight: '16px'}}>Published</span>
                            </SelectItem>
                            <SelectItem value="Draft">
                              <span className={cn("rounded-full px-2 py-0 text-xs font-semibold h-5 min-h-0 text-center whitespace-nowrap overflow-visible", statusVariants.Draft)} style={{lineHeight: '16px'}}>Draft</span>
                            </SelectItem>
                            <SelectItem value="Archived">
                              <span className={cn("rounded-full px-2 py-0 text-xs font-semibold h-5 min-h-0 text-center whitespace-nowrap overflow-visible", statusVariants.Archived)} style={{lineHeight: '16px'}}>Archived</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={cn("rounded-full px-2 py-0 text-xs font-semibold h-5 min-h-0 text-center whitespace-nowrap overflow-visible", statusVariants[agent.status])}>
                          {agent.status}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleView(agent)}>
                            <Eye className="mr-2 h-4 w-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(agent)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(agent)}>
                            <Copy className="mr-2 h-4 w-4" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-700"
                            onClick={() => handleDelete(agent)}
                          >
                            <Archive className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No agents found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
           <div className="text-xs text-muted-foreground">
             Showing <strong>{paginatedAgents.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong>
             -<strong>{Math.min(currentPage * itemsPerPage, filteredAgents.length)}</strong> of <strong>{filteredAgents.length}</strong> agents
           </div>
           <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
           </div>
        </CardFooter>
      </Card>

      {/* Agent Details Modal */}
      {viewModalOpen && viewAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-black" onClick={() => setViewModalOpen(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-2">Agent Details</h2>
            <div className="mb-2"><b>Name:</b> {viewAgent.name}</div>
            <div className="mb-2"><b>Use Case:</b> {viewAgent.useCase}</div>
            <div className="mb-2"><b>Tags:</b> {viewAgent.tags && viewAgent.tags.join(', ')}</div>
            <div className="mb-2"><b>Created By:</b> {viewAgent.createdBy}</div>
            <div className="mb-2"><b>Client:</b> {viewAgent.clientName}</div>
            <div className="mb-2"><b>Status:</b> {viewAgent.status}</div>
            <div className="mb-2"><b>Version:</b> {viewAgent.version}</div>
            <div className="mb-2"><b>Source:</b> {viewAgent.source}</div>
            <div className="mb-2"><b>Last Modified:</b> {viewAgent.lastModified ? new Date(viewAgent.lastModified).toLocaleString() : ''}</div>
            {/* Show more details from details API if available */}
            {viewAgent.details && (
              <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto mt-2 max-h-60">{JSON.stringify(viewAgent.details, null, 2)}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}