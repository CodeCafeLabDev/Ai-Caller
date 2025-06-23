
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Eye, CheckCircle, History, RotateCcw, ChevronsUpDown, Check, Diff } from "lucide-react";
import { format } from "date-fns";
import type { Metadata } from 'next';

// export const metadata: Metadata = {
//   title: 'AI Template Version History - AI Caller',
//   description: 'Track changes, view previous versions, and manage the version history of your AI script templates.',
//   keywords: ['version history', 'ai templates', 'script versions', 'change tracking', 'AI Caller'],
// };

interface AITemplateSummary {
  id: string;
  name: string;
}

interface TemplateVersion {
  id: string;
  versionNumber: string;
  modifiedBy: string;
  modifiedDate: string;
  notes?: string;
  content: string;
  isActive?: boolean;
}

const mockTemplateList: AITemplateSummary[] = [
  { id: "tpl_1", name: "Lead Qualification Pro" },
  { id: "tpl_2", name: "Appointment Reminder Basic" },
  { id: "tpl_3", name: "Feedback Collector v2" },
];

const mockTemplateVersionsData: Record<string, TemplateVersion[]> = {
  "tpl_1": [
    { id: "v1a", versionNumber: "1.0", modifiedBy: "Admin User", modifiedDate: "2024-07-10", notes: "Initial release.", content: "BOT: Hello, is this {{contact_name}}?\nUSER_EXPECTS: Yes/No", isActive: false },
    { id: "v1b", versionNumber: "1.1", modifiedBy: "AI System", modifiedDate: "2024-07-12", notes: "Added fallback for no response.", content: "BOT: Hello, is this {{contact_name}}?\nUSER_EXPECTS: Yes/No\nFALLBACK: Sorry, I didn't catch that.", isActive: false },
    { id: "v1c", versionNumber: "1.2", modifiedBy: "Admin User", modifiedDate: "2024-07-15", notes: "Updated greeting message.", content: "BOT: Hi {{contact_name}}, hope you're having a great day! This is a call from AI Caller.\nUSER_EXPECTS: Greeting Response", isActive: true },
  ],
  "tpl_2": [
    { id: "v2a", versionNumber: "1.0", modifiedBy: "System", modifiedDate: "2024-06-20", notes: "Basic reminder template.", content: "BOT: Hi {{name}}, this is a reminder for your appointment on {{appointment_date}} at {{appointment_time}}.\nUSER_EXPECTS: Confirmation", isActive: true },
  ],
  "tpl_3": [
    { id: "v3a", versionNumber: "0.8", modifiedBy: "Admin User", modifiedDate: "2024-07-01", notes: "Draft for feedback collection.", content: "BOT: Hi {{customer_name}}, we'd love to get your feedback on your recent purchase. Are you free for a quick chat?\nUSER_EXPECTS: Yes/No/Later", isActive: true },
  ],
};


export default function AiTemplateVersionHistoryPage() {
  const { toast } = useToast();
  const [availableTemplates] = React.useState<AITemplateSummary[]>(mockTemplateList);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | undefined>();
  const [versions, setVersions] = React.useState<TemplateVersion[]>([]);
  const [templateComboboxOpen, setTemplateComboboxOpen] = React.useState(false);

  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);
  const [viewingVersionDetails, setViewingVersionDetails] = React.useState<TemplateVersion | null>(null);

  React.useEffect(() => {
    if (selectedTemplateId) {
      setVersions(mockTemplateVersionsData[selectedTemplateId] || []);
    } else {
      setVersions([]);
    }
  }, [selectedTemplateId]);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setTemplateComboboxOpen(false);
  };

  const handleViewVersion = (version: TemplateVersion) => {
    setViewingVersionDetails(version);
    setIsViewDialogOpen(true);
  };

  const handleSetAsActive = (versionId: string) => {
    const selectedTemplate = availableTemplates.find(t => t.id === selectedTemplateId);
    setVersions(prev => prev.map(v => ({ ...v, isActive: v.id === versionId })));
    toast({
      title: "Version Set to Active (Simulated)",
      description: `Version ${versions.find(v=>v.id === versionId)?.versionNumber} of template "${selectedTemplate?.name}" is now active.`,
    });
  };
  
  const handleRollback = (versionId: string) => {
    handleSetAsActive(versionId); 
    toast({
      title: "Rollback Successful (Simulated)",
      description: `Rolled back to version ${versions.find(v=>v.id === versionId)?.versionNumber}.`,
    });
  };

  const handleCompareVersions = (versionId: string) => {
    toast({
      title: "Compare Versions (Simulated)",
      description: `Compare functionality for version ID ${versionId} to be implemented.`,
    });
  };
  
  const selectedTemplateName = availableTemplates.find(t => t.id === selectedTemplateId)?.name;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">AI Template Version History</h1>
          <p className="text-muted-foreground">Track changes and manage versions of your AI templates.</p>
        </div>
        <Popover open={templateComboboxOpen} onOpenChange={setTemplateComboboxOpen}>
            <PopoverTrigger asChild>
            <Button
                variant="outline"
                role="combobox"
                aria-expanded={templateComboboxOpen}
                className="w-full sm:w-[300px] justify-between"
            >
                {selectedTemplateId
                ? availableTemplates.find((template) => template.id === selectedTemplateId)?.name
                : "Select a template..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
                <CommandInput placeholder="Search template..." />
                <CommandList>
                <CommandEmpty>No template found.</CommandEmpty>
                <CommandGroup>
                    {availableTemplates.map((template) => (
                    <CommandItem
                        key={template.id}
                        value={template.name}
                        onSelect={() => handleSelectTemplate(template.id)}
                    >
                        <Check
                        className={cn(
                            "mr-2 h-4 w-4",
                            selectedTemplateId === template.id ? "opacity-100" : "opacity-0"
                        )}
                        />
                        {template.name}
                    </CommandItem>
                    ))}
                </CommandGroup>
                </CommandList>
            </Command>
            </PopoverContent>
        </Popover>
      </div>

      {selectedTemplateId ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Version History for: {selectedTemplateName}</CardTitle>
            <CardDescription>Review and manage different versions of this template.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[600px]">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Modified By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {versions.length > 0 ? versions.sort((a,b) => parseFloat(b.versionNumber) - parseFloat(a.versionNumber)).map((version) => (
                    <TableRow key={version.id}>
                        <TableCell className="font-medium">{version.versionNumber}</TableCell>
                        <TableCell>{version.modifiedBy}</TableCell>
                        <TableCell>{format(new Date(version.modifiedDate), "MMM dd, yyyy - HH:mm")}</TableCell>
                        <TableCell className="max-w-xs truncate" title={version.notes}>{version.notes || "-"}</TableCell>
                        <TableCell>
                        {version.isActive && <Badge>Active</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Version Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewVersion(version)}>
                                <Eye className="mr-2 h-4 w-4" /> View Version
                            </DropdownMenuItem>
                            {!version.isActive && (
                                <DropdownMenuItem onClick={() => handleSetAsActive(version.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Set As Active
                                </DropdownMenuItem>
                            )}
                             <DropdownMenuItem onClick={() => handleCompareVersions(version.id)}>
                                <Diff className="mr-2 h-4 w-4" /> Compare (Mock)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-orange-600 focus:text-orange-700" onClick={() => handleRollback(version.id)} disabled={version.isActive}>
                                <RotateCcw className="mr-2 h-4 w-4" /> Rollback to this Version
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    )) : (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No versions found for this template.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <History className="mx-auto h-12 w-12 mb-4" />
          <p className="text-lg">Please select a template to view its version history.</p>
        </div>
      )}

      {viewingVersionDetails && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Viewing Version {viewingVersionDetails.versionNumber} of {selectedTemplateName}
              </DialogTitle>
              <DialogDescription>
                Modified by {viewingVersionDetails.modifiedBy} on {format(new Date(viewingVersionDetails.modifiedDate), "PPPp")}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <h4 className="font-semibold mb-1">Version Notes:</h4>
                <p className="text-sm text-muted-foreground p-2 border rounded bg-muted">
                  {viewingVersionDetails.notes || "No notes for this version."}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Template Content:</h4>
                <ScrollArea className="h-[300px] w-full rounded-md border">
                  <Textarea
                    value={viewingVersionDetails.content}
                    readOnly
                    className="min-h-[300px] font-mono text-xs bg-background"
                  />
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
