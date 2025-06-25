
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { UploadCloud, Download, FileJson, Loader2, CheckCircle, AlertCircle, Edit3 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from 'next';

// export const metadata: Metadata = {
//   title: 'Import/Export AI Templates - AI Caller',
//   description: 'Manage AI conversation templates by exporting them for backup or sharing, or importing pre-existing templates in JSON format.',
//   keywords: ['import templates', 'export templates', 'json templates', 'ai scripts', 'conversation backup', 'AI Caller'],
// };

interface MockTemplate {
  id: string;
  name: string;
  version: string;
  content: object; 
}

const mockTemplatesForExport: MockTemplate[] = [
  { id: "tpl_1", name: "Lead Qualification Pro", version: "1.2", content: { info: "Lead gen script details...", nodes: [] } },
  { id: "tpl_2", name: "Appointment Reminder Basic", version: "1.0", content: { info: "Reminder script details...", nodes: [] } },
  { id: "tpl_3", name: "Feedback Collector v2", version: "0.8", content: { info: "Feedback script details...", nodes: [] } },
];

interface ImportedTemplateDetails {
  name: string;
  description?: string;
  category?: string;
  language?: string;
}

export default function AiTemplateImportExportPage() {
  const { toast } = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>("");
  const [isExporting, setIsExporting] = React.useState(false);

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [fileName, setFileName] = React.useState<string>("");
  const [isImporting, setIsImporting] = React.useState(false);
  const [importProgress, setImportProgress] = React.useState(0);
  const [showImportConfirmation, setShowImportConfirmation] = React.useState(false);
  const [importedTemplateDetails, setImportedTemplateDetails] = React.useState<ImportedTemplateDetails | null>(null);
  
  const [editName, setEditName] = React.useState("");
  const [editCategory, setEditCategory] = React.useState(""); 
  const [editStatus, setEditStatus] = React.useState<"Draft" | "Published">("Draft");


  const handleExport = () => {
    if (!selectedTemplateId) {
      toast({
        title: "No Template Selected",
        description: "Please select a template to export.",
        variant: "destructive",
      });
      return;
    }
    setIsExporting(true);
    const templateToExport = mockTemplatesForExport.find(t => t.id === selectedTemplateId);

    setTimeout(() => {
      const jsonData = JSON.stringify(templateToExport, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${templateToExport?.name.replace(/\s+/g, '_')}_v${templateToExport?.version}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Template "${templateToExport?.name}" has been exported.`,
      });
      setIsExporting(false);
    }, 1500);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/json") {
        setSelectedFile(file);
        setFileName(file.name);
        setShowImportConfirmation(false); 
        setImportedTemplateDetails(null);
        
        setIsImporting(true);
        setImportProgress(0);
        let progress = 0;
        const interval = setInterval(() => {
          progress += 20;
          setImportProgress(progress);
          if (progress >= 100) {
            clearInterval(interval);
            setIsImporting(false);
            try {
              const mockParsedData: Partial<MockTemplate> = { name: file.name.replace(".json", ""), description: "Imported from file" };
              setImportedTemplateDetails({
                name: mockParsedData.name || "Unnamed Template",
                description: mockParsedData.description || "No description provided.",
                category: "Other", 
                language: "English (US)", 
              });
              setEditName(mockParsedData.name || "Unnamed Template");
              setEditCategory("Other");
              setEditStatus("Draft");
              setShowImportConfirmation(true);
               toast({ title: "File Processed", description: "Review details and finalize import."});
            } catch (e) {
               toast({ title: "Import Error", description: "Could not parse JSON file.", variant: "destructive"});
               resetImportState();
            }
          }
        }, 300);

      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a valid .json file.",
          variant: "destructive",
        });
        resetImportState();
      }
    }
  };
  
  const resetImportState = () => {
    setSelectedFile(null);
    setFileName("");
    setIsImporting(false);
    setImportProgress(0);
    setShowImportConfirmation(false);
    setImportedTemplateDetails(null);
  };

  const handleFinalizeImport = (status: "Draft" | "Published") => {
    if (!importedTemplateDetails) return;
    
    const finalName = editName || importedTemplateDetails.name;

    toast({
      title: `Import Complete (Simulated)`,
      description: `Template "${finalName}" imported as ${status}. Category: ${editCategory}.`,
    });
    resetImportState();
  };

  return (
    <div className="container mx-auto py-8 space-y-10">
      <div className="flex flex-col items-center text-center">
        <FileJson className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold font-headline">Import & Export AI Templates</h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
          Easily manage your AI conversation templates by exporting them for backup or sharing, or importing pre-existing templates in JSON format.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Download className="mr-3 h-6 w-6 text-primary" /> Export Template
            </CardTitle>
            <CardDescription>
              Select a template to download its configuration as a JSON file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="select-template-export">Template to Export</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger id="select-template-export">
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {mockTemplatesForExport.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} (v{template.version})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleExport}
              disabled={isExporting || !selectedTemplateId}
              className="w-full text-base py-3"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" /> Export as JSON
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <UploadCloud className="mr-3 h-6 w-6 text-primary" /> Import Template
            </CardTitle>
            <CardDescription>
              Upload a JSON file to import an AI template.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-background border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary/80 focus:outline-none"
              >
                <span className="flex items-center space-x-2">
                  <UploadCloud className="w-6 h-6 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">
                    {fileName ? fileName : "Click to upload or drag & drop JSON file"}
                  </span>
                </span>
                <Input id="file-upload" type="file" accept=".json" onChange={handleFileChange} className="sr-only" />
              </Label>
              {fileName && !isImporting && !showImportConfirmation && <p className="text-xs text-muted-foreground mt-1">Selected: {fileName}</p>}
            </div>

            {isImporting && (
              <div className="space-y-2 pt-2">
                <Label>Processing file...</Label>
                <Progress value={importProgress} className="w-full h-2.5" />
                <p className="text-sm text-muted-foreground text-center animate-pulse">{importProgress}%</p>
              </div>
            )}
            
            {showImportConfirmation && importedTemplateDetails && (
                <div className="pt-4 border-t">
                    <h3 className="text-md font-semibold mb-3">Review & Finalize Import</h3>
                    <div className="space-y-3">
                         <div className="space-y-1">
                            <Label htmlFor="edit-name">Template Name*</Label>
                            <Input id="edit-name" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Enter template name" />
                        </div>
                        <div className="space-y-1">
                             <Label htmlFor="edit-category">Category*</Label>
                             <Input id="edit-category" value={editCategory} onChange={e => setEditCategory(e.target.value)} placeholder="e.g., Lead Generation" />
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="edit-status">Set Status*</Label>
                             <Select value={editStatus} onValueChange={(value) => setEditStatus(value as "Draft" | "Published")}>
                                <SelectTrigger id="edit-status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Draft">Draft</SelectItem>
                                    <SelectItem value="Published">Published</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-xs text-muted-foreground">Original Description: {importedTemplateDetails.description}</p>
                    </div>
                </div>
            )}

          </CardContent>
           <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4">
            {showImportConfirmation ? (
              <>
                <Button onClick={() => handleFinalizeImport("Draft")} variant="secondary" className="w-full sm:w-auto">
                  <Edit3 className="mr-2 h-4 w-4" /> Import & Save as Draft
                </Button>
                <Button onClick={() => handleFinalizeImport("Published")} className="w-full sm:w-auto">
                  <CheckCircle className="mr-2 h-4 w-4" /> Import & Publish
                </Button>
              </>
            ) : (
                 <Button onClick={() => document.getElementById('file-upload')?.click()} disabled={isImporting} className="w-full text-base py-3">
                    {isImporting ? (
                        <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Importing...
                        </>
                    ) : (
                        <>
                         <FileJson className="mr-2 h-5 w-5" /> Choose JSON File
                        </>
                    )}
                 </Button>
            )}
          </CardFooter>
        </Card>
      </div>
      <Separator />
      <Card className="mt-8">
        <CardHeader>
            <CardTitle>How it Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><strong>Exporting:</strong> Select one of your existing templates from the dropdown. Click "Export as JSON" to download a file containing its structure, script content, and metadata. This file can be used for backup or sharing.</p>
            <p><strong>Importing:</strong> Click "Choose JSON File" and select a valid template JSON file from your computer. The system will (simulate) parse the file. You can then review/edit basic details like name and category, and choose to save it as a draft or publish it directly.</p>
            <p><strong>JSON Structure (Conceptual):</strong> A valid template JSON should ideally contain fields like `name`, `description`, `version`, `category`, `language`, `scriptNodes` (an array of conversation steps), and `globalVariables`.</p>
        </CardContent>
      </Card>
    </div>
  );
}
