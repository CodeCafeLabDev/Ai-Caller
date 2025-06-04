
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, Upload, FileText, Loader2, AlertTriangle, Wand2, Edit, Bot, AlertOctagon, ListChecks, Terminal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress"; // Added Progress

interface MockAiTemplate {
  id: string;
  name: string;
  content: string; // Mock script content
}

const mockAiTemplates: MockAiTemplate[] = [
  { id: "tpl_1", name: "Lead Qualification v1.2", content: "BOT: Hello, is this {{name}}?\nUSER_EXPECTS: Greeting\nIF intent:positive THEN GOTO:qualify_interest\nELSE GOTO:end_call_negative" },
  { id: "tpl_2", name: "Customer Support - Billing", content: "BOT: Welcome to billing support. How can I help?\nUSER_EXPECTS: BillingQuery\n..." },
  { id: "tpl_3", name: "Appointment Reminder Flow", content: "BOT: Hi {{contact_name}}, reminding you about your appointment on {{date}}.\nUSER_EXPECTS: Confirmation\nIF intent:confirm THEN GOTO:confirmed\nIF intent:reschedule THEN GOTO:reschedule_options" },
];

interface ValidationResult {
  id: string;
  type: "error" | "warning" | "info";
  nodeOrLine: string;
  message: string;
  suggestion?: string;
}

const mockValidationResults: ValidationResult[] = [
  { id: "vr1", type: "error", nodeOrLine: "Node 5: GOTO_ACTION", message: "Target node 'qualify_interest_v2' not found. Did you mean 'qualify_interest'?", suggestion: "Change target to 'qualify_interest' or create 'qualify_interest_v2'." },
  { id: "vr2", type: "warning", nodeOrLine: "Line 12", message: "Detected possible infinite loop if user intent is 'repeat'.", suggestion: "Add a maximum retry counter for 'repeat' intent." },
  { id: "vr3", type: "error", nodeOrLine: "Node 2: USER_INPUT_EXPECTED", message: "No fallback path defined for unexpected user input.", suggestion: "Add a general fallback node or intent." },
  { id: "vr4", type: "info", nodeOrLine: "Global", message: "Consider using shorter prompts for better STT accuracy in noisy environments.", suggestion: "Review prompts in nodes: Greeting, ProductInfo." },
  { id: "vr5", type: "warning", nodeOrLine: "Node 8: DATA_DIP", message: "API call to 'external_crm_api' has no explicit timeout defined.", suggestion: "Set a timeout (e.g., 5 seconds) for the API call step." },
];


export default function ScriptValidationPage() {
  const { toast } = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>("");
  const [scriptContent, setScriptContent] = React.useState<string>("");
  const [validationResults, setValidationResults] = React.useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = React.useState(false);
  const [validationProgress, setValidationProgress] = React.useState(0);


  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = mockAiTemplates.find(t => t.id === templateId);
    setScriptContent(template ? template.content : "Select a template to view its content.");
    setValidationResults([]); // Clear previous results
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".json")) { // Basic type check
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setScriptContent(content);
                setSelectedTemplateId(""); // Clear selected template if file uploaded
                setValidationResults([]);
                toast({ title: "File Uploaded", description: `${file.name} loaded for validation.` });
            };
            reader.readAsText(file);
        } else {
            toast({ title: "Invalid File Type", description: "Please upload a .txt or .json script file.", variant: "destructive"});
        }
    }
  };

  const handleValidateScript = () => {
    if (!scriptContent.trim()) {
      toast({ title: "No Script Loaded", description: "Please select a template or upload a script file.", variant: "destructive" });
      return;
    }
    setIsValidating(true);
    setValidationResults([]);
    setValidationProgress(0);

    // Simulate validation progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setValidationProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        // Simulate API call delay
        setTimeout(() => {
          // Populate with mock results for now
          setValidationResults(mockValidationResults);
          toast({ title: "Validation Complete", description: "Review the errors and warnings below." });
          setIsValidating(false);
        }, 500);
      }
    }, 200);
  };
  
  const resultTypeBadgeVariant = (type: ValidationResult["type"]) => {
    if (type === "error") return "destructive";
    if (type === "warning") return "secondary"; // Using secondary for yellow-ish, or define custom
    return "outline";
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <CheckSquare className="mr-3 h-8 w-8 text-primary" /> AI Script Validation Tool
          </h1>
          <p className="text-muted-foreground">
            Scan AI script templates for logic errors, missing intents, and potential issues.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Script Input</CardTitle>
          <CardDescription>Upload a script file or select an existing AI template to validate.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4 items-end">
            <div>
              <Label htmlFor="select-template">Select Existing Template</Label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateSelect} disabled={isValidating}>
                <SelectTrigger id="select-template"><SelectValue placeholder="Choose a template..." /></SelectTrigger>
                <SelectContent>
                  {mockAiTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div>
                <Label htmlFor="upload-script" className="block mb-1">Or Upload Script File (.txt, .json)</Label>
                <Input id="upload-script" type="file" onChange={handleFileUpload} accept=".txt,.json" disabled={isValidating}/>
            </div>
          </div>
          <div>
            <Label htmlFor="script-preview">Script Content Preview</Label>
            <ScrollArea className="h-48 mt-1 w-full rounded-md border">
              <Textarea
                id="script-preview"
                value={scriptContent}
                readOnly
                placeholder="Script content will appear here..."
                className="min-h-[180px] font-mono text-xs bg-muted/50"
              />
            </ScrollArea>
          </div>
          <Button onClick={handleValidateScript} disabled={isValidating || !scriptContent.trim()} className="w-full md:w-auto">
            {isValidating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validating...</> : <><Terminal className="mr-2 h-4 w-4"/>Validate Script</>}
          </Button>
           {isValidating && <Progress value={validationProgress} className="w-full mt-2 h-2" />}
        </CardContent>
      </Card>

      {validationResults.length > 0 && !isValidating && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><AlertOctagon className="mr-2 h-5 w-5 text-destructive"/>Validation Errors & Warnings</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Type</TableHead>
                      <TableHead className="w-[150px]">Node/Line</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Suggestion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationResults.map(result => (
                      <TableRow key={result.id}>
                        <TableCell><Badge variant={resultTypeBadgeVariant(result.type)} className="capitalize">{result.type}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">{result.nodeOrLine}</TableCell>
                        <TableCell>{result.message}</TableCell>
                        <TableCell>{result.suggestion || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Wand2 className="mr-2 h-5 w-5 text-blue-500"/>Fix Suggestions & Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Review suggestions above. Some issues might have an auto-fix option (simulated).</p>
                <Button variant="outline" onClick={() => toast({title: "Auto-Fix Clicked", description: "Attempting to auto-fix issues (simulated)."})} disabled>
                    Auto-Fix Minor Issues (Simulated)
                </Button>
            </CardContent>
            <CardFooter className="gap-2">
                 <Button onClick={() => toast({title: "Edit in AI Templates", description: "Redirecting to template editor (simulated)."})}>
                    <Edit className="mr-2 h-4 w-4"/> Edit in AI Templates
                </Button>
                <Button variant="secondary" onClick={() => toast({title: "Test in Simulator", description: "Loading script in Call Flow Simulator (simulated)."})}>
                    <Bot className="mr-2 h-4 w-4"/> Test in Call Flow Simulator
                </Button>
            </CardFooter>
          </Card>
        </div>
      )}
       {!isValidating && validationResults.length === 0 && scriptContent.trim() && (
            <Card>
                <CardHeader><CardTitle className="flex items-center"><ListChecks className="mr-2 h-5 w-5 text-green-500"/>Validation Status</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-green-600">No issues found in the current script after validation, or validation not yet run.</p>
                </CardContent>
            </Card>
        )}

    </div>
  );
}

    