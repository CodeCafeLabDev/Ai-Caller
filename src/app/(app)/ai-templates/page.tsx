
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
import { cn } from "@/lib/utils";
import type { Metadata } from 'next';

// export const metadata: Metadata = {
//   title: 'AI Script Templates - AI Caller',
//   description: 'Manage global AI conversation templates for various use cases and languages.',
//   keywords: ['ai templates', 'script templates', 'conversation flow', 'bot scripts', 'AI Caller'],
// };

export type AITemplateStatus = "Draft" | "Published" | "Archived";
export type AITemplateUseCase = "Sales" | "Reminder" | "Feedback" | "Support" | "Lead Generation" | "Payment Collection" | "Survey" | "Other";
export type AITemplateLanguage = "English (US)" | "Spanish (ES)" | "French (FR)" | "German (DE)" | "Hindi (IN)" | "Other";


export type AITemplate = {
  id: string;
  name: string;
  useCase: AITemplateUseCase;
  tags: string[];
  createdBy: string; 
  language: AITemplateLanguage;
  lastModified: string; 
  status: AITemplateStatus;
  version: string;
};

const mockTemplates: AITemplate[] = [
  { id: "tpl_1", name: "Lead Qualification Pro", useCase: "Lead Generation", tags: ["sales", "b2b", "qualification"], createdBy: "Admin User", language: "English (US)", lastModified: "2024-07-15", status: "Published", version: "1.2" },
  { id: "tpl_2", name: "Appointment Reminder Basic", useCase: "Reminder", tags: ["appointment", "customer service"], createdBy: "System", language: "Spanish (ES)", lastModified: "2024-06-20", status: "Published", version: "1.0" },
  { id: "tpl_3", name: "Feedback Collector v2", useCase: "Feedback", tags: ["survey", "customer experience"], createdBy: "Admin User", language: "English (US)", lastModified: "2024-07-01", status: "Draft", version: "0.8" },
  { id: "tpl_4", name: "Sales Pitch - Enterprise", useCase: "Sales", tags: ["enterprise", "pitch"], createdBy: "Sales Team Lead", language: "English (US)", lastModified: "2024-05-10", status: "Archived", version: "2.1" },
  { id: "tpl_5", name: "Payment Due Notification", useCase: "Payment Collection", tags: ["billing", "finance"], createdBy: "System", language: "Hindi (IN)", lastModified: "2024-07-18", status: "Published", version: "1.0" },
];

const statusVariants: Record<AITemplateStatus, string> = {
  Published: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
  Draft: "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100",
  Archived: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100",
};

const useCaseOptions: {value: AITemplateUseCase | "all"; label: string}[] = [
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

const languageOptions: {value: AITemplateLanguage | "all"; label: string}[] = [
    {value: "all", label: "All Languages"},
    {value: "English (US)", label: "English (US)"},
    {value: "Spanish (ES)", label: "Spanish (ES)"},
    {value: "French (FR)", label: "French (FR)"},
    {value: "German (DE)", label: "German (DE)"},
    {value: "Hindi (IN)", label: "Hindi (IN)"},
    {value: "Other", label: "Other"},
];

const statusFilterOptions: {value: AITemplateStatus | "all"; label: string}[] = [
    {value: "all", label: "All Statuses"},
    {value: "Published", label: "Published"},
    {value: "Draft", label: "Draft"},
    {value: "Archived", label: "Archived"},
];


export default function AiTemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = React.useState<AITemplate[]>(mockTemplates);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [useCaseFilter, setUseCaseFilter] = React.useState<AITemplateUseCase | "all">("all");
  const [languageFilter, setLanguageFilter] = React.useState<AITemplateLanguage | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<AITemplateStatus | "all">("all");

  const [useCaseComboboxOpen, setUseCaseComboboxOpen] = React.useState(false);
  const [languageComboboxOpen, setLanguageComboboxOpen] = React.useState(false);
  const [statusComboboxOpen, setStatusComboboxOpen] = React.useState(false);

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const handleTemplateAction = (actionName: string, templateName: string) => {
    toast({
      title: `${actionName} (Simulated)`,
      description: `Action performed on template: ${templateName}.`,
    });
  };

  const filteredTemplates = templates.filter((template) => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const matchesSearch =
      template.name.toLowerCase().includes(lowerSearchTerm) ||
      template.useCase.toLowerCase().includes(lowerSearchTerm) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm));

    const matchesUseCase = useCaseFilter === "all" || template.useCase === useCaseFilter;
    const matchesLanguage = languageFilter === "all" || template.language === languageFilter;
    const matchesStatus = statusFilter === "all" || template.status === statusFilter;
    
    return matchesSearch && matchesUseCase && matchesLanguage && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">AI Script Templates</h1>
          <p className="text-muted-foreground">Manage global AI conversation templates.</p>
        </div>
        <Button size="lg" asChild>
            <Link href="/ai-templates/create">
                <PlusCircle className="mr-2 h-5 w-5" />
                Create New Template
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Use Case</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Version</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTemplates.length > 0 ? paginatedTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    {template.name}
                    <div className="flex flex-wrap gap-1 mt-1">
                        {template.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>{template.useCase}</TableCell>
                  <TableCell>{template.createdBy}</TableCell>
                  <TableCell>{template.language}</TableCell>
                  <TableCell>{new Date(template.lastModified).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${statusVariants[template.status]}`}>{template.status}</Badge>
                  </TableCell>
                  <TableCell>{template.version}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleTemplateAction("View", template.name)}>
                          <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTemplateAction("Edit", template.name)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTemplateAction("Duplicate", template.name)}>
                          <Copy className="mr-2 h-4 w-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-yellow-600 focus:text-yellow-700" onClick={() => handleTemplateAction("Archive", template.name)}>
                          <Archive className="mr-2 h-4 w-4" /> Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No templates found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
           <div className="text-xs text-muted-foreground">
             Showing <strong>{paginatedTemplates.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong>
             -<strong>{Math.min(currentPage * itemsPerPage, filteredTemplates.length)}</strong> of <strong>{filteredTemplates.length}</strong> templates
           </div>
           <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
           </div>
        </CardFooter>
      </Card>
    </div>
  );
}
