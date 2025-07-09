
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { FlaskConical, Play, MessageSquare, Users, FileText, AlertOctagon, Zap, LogIn, ChevronRight, RotateCcw, Terminal } from "lucide-react";
import Image from "next/image";

// Mock data
const mockClients = [
  { id: "client_1", name: "Innovate Corp" },
  { id: "client_2", name: "Solutions Ltd" },
];

const mockCampaignsAgents = {
  client_1: [
    { id: "tpl_leadgen_c1", name: "Lead Qualification v1.2" },
    { id: "tpl_feedback_c1", name: "Customer Feedback Survey" },
  ],
  client_2: [
    { id: "tpl_reminder_c2", name: "Appointment Reminder Main" },
  ],
};

interface CallStep {
  id: string;
  type: "BOT_SPEAK" | "USER_INPUT_EXPECTED" | "AI_DECISION" | "END_CALL";
  message?: string; // For BOT_SPEAK
  expectedIntents?: string[]; // For USER_INPUT_EXPECTED
  branches?: { intent: string; nextStepId: string }[]; // For AI_DECISION
  action?: string; // For AI_DECISION
  outputVars?: Record<string, any>; // For AI_DECISION
  fallbackStepId?: string; // For USER_INPUT_EXPECTED or AI_DECISION
}

const sampleCallFlow: Record<string, CallStep> = {
  start: { id: "start", type: "BOT_SPEAK", message: "Hello {{name}}! Welcome to AI Caller. How can I help you today?" },
  step1: { id: "step1", type: "USER_INPUT_EXPECTED", expectedIntents: ["check_balance", "make_payment", "speak_to_agent"], fallbackStepId: "fallback_general" },
  check_balance_branch: { id: "check_balance_branch", type: "AI_DECISION", action: "RetrieveBalance", outputVars: { balance: 500 }, branches: [{ intent: "default", nextStepId: "tell_balance" }] },
  tell_balance: { id: "tell_balance", type: "BOT_SPEAK", message: "Your current balance is ${{balance}}." },
  make_payment_branch: { id: "make_payment_branch", type: "AI_DECISION", action: "InitiatePaymentFlow", branches: [{ intent: "default", nextStepId: "payment_confirm" }] },
  payment_confirm: { id: "payment_confirm", type: "BOT_SPEAK", message: "Sure, I can help with that. How much would you like to pay?" },
  speak_to_agent_branch: { id: "speak_to_agent_branch", type: "AI_DECISION", action: "TransferToAgent", branches: [{ intent: "default", nextStepId: "transfer_message" }] },
  transfer_message: { id: "transfer_message", type: "BOT_SPEAK", message: "Please wait while I connect you to an agent." },
  fallback_general: { id: "fallback_general", type: "BOT_SPEAK", message: "I'm sorry, I didn't understand that. Could you please rephrase?" },
  end: { id: "end", type: "END_CALL", message: "Thank you for calling. Goodbye!" }
};

// Utility to replace placeholders like {{name}}
const replacePlaceholders = (text: string, variables: Record<string, any>): string => {
  if (!text) return "";
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
};

export default function SimulateCallFlowPage() {
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = React.useState<string>("");
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string>("");
  const [customerName, setCustomerName] = React.useState("Test User");
  const [customerPhone, setCustomerPhone] = React.useState("555-123-4567");
  const [initialVariables, setInitialVariables] = React.useState('{\n  "name": "Test User"\n}');

  const [simulationLog, setSimulationLog] = React.useState<string[]>([]);
  const [currentBotMessage, setCurrentBotMessage] = React.useState<string>("");
  const [expectedUserIntents, setExpectedUserIntents] = React.useState<string[]>([]);
  const [userResponse, setUserResponse] = React.useState("");
  const [detectedIntent, setDetectedIntent] = React.useState<string | null>(null);
  const [nextAction, setNextAction] = React.useState<string | null>(null);
  const [currentVariables, setCurrentVariables] = React.useState<Record<string, any>>({});

  const [isSimulating, setIsSimulating] = React.useState(false);
  const [currentStepId, setCurrentStepId] = React.useState<string | null>(null);

  const availableCampaigns = selectedClientId ? mockCampaignsAgents[selectedClientId as keyof typeof mockCampaignsAgents] || [] : [];

  const logEvent = (message: string) => {
    setSimulationLog(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  const processStep = (stepId: string | null, vars: Record<string, any>) => {
    if (!stepId) {
      logEvent("ERROR: No step ID to process.");
      setCurrentBotMessage("Simulation error: Invalid step.");
      setIsSimulating(false);
      return;
    }

    const step = sampleCallFlow[stepId];
    if (!step) {
      logEvent(`ERROR: Step ID "${stepId}" not found in call flow.`);
      setCurrentBotMessage(`Simulation error: Step "${stepId}" undefined.`);
      setIsSimulating(false);
      return;
    }

    logEvent(`Processing step: ${stepId} (${step.type})`);
    setCurrentStepId(stepId);
    setCurrentVariables(vars); // Update current variables

    switch (step.type) {
      case "BOT_SPEAK":
        const botMsg = replacePlaceholders(step.message || "...", vars);
        setCurrentBotMessage(botMsg);
        logEvent(`BOT: ${botMsg}`);
        // Auto-progress if next logical step is user input or another bot message without branches
        const nextDirectStepKey = Object.keys(sampleCallFlow).find(key => 
            sampleCallFlow[key].id !== step.id && // Not itself
            !Object.values(sampleCallFlow).some(s => s.branches?.some(b => b.nextStepId === key)) && // Not a branch target
            !Object.values(sampleCallFlow).some(s => s.fallbackStepId === key) && // Not a fallback
            (sampleCallFlow[key].type === "USER_INPUT_EXPECTED" || 
             (sampleCallFlow[key].type === "BOT_SPEAK" && key !== 'end')) // A simple next bot message
        );
        // This logic is very simplified. A real flow would have explicit transitions.
        // We'll primarily rely on AI_DECISION for branching.
        // For simple bot speak, let's find the first USER_INPUT_EXPECTED or a specific next step.
        const nextStepAfterSpeak = Object.values(sampleCallFlow).find(s => s.type === "USER_INPUT_EXPECTED"); // Very naive
        if (nextStepAfterSpeak && step.id !== "end") {
             setTimeout(() => processStep(nextStepAfterSpeak.id, vars), 500); // Slight delay for readability
        } else if(step.id !== "end") {
            // If no immediate user input expected, perhaps it's an end or needs decision
            logEvent("BOT finished speaking. Waiting for user or decision.");
        }
        break;
      case "USER_INPUT_EXPECTED":
        setCurrentBotMessage(currentBotMessage || "Waiting for user response..."); // Keep last bot message if any
        setExpectedUserIntents(step.expectedIntents || []);
        logEvent(`SYSTEM: Expecting user input. Intents: ${step.expectedIntents?.join(", ") || "Any"}`);
        break;
      case "AI_DECISION":
        logEvent(`AI Processing: Action - ${step.action || "None"}`);
        setDetectedIntent(step.action || "Processing...");
        setNextAction(step.branches?.[0]?.intent || "N/A"); // Assume default branch for mock
        
        const updatedVars = { ...vars, ...(step.outputVars || {}) };
        if (step.outputVars) logEvent(`AI: Set variables - ${JSON.stringify(step.outputVars)}`);
        setCurrentVariables(updatedVars);

        const nextBranchStepId = step.branches?.[0]?.nextStepId; // Mock: take first branch
        if (nextBranchStepId) {
          logEvent(`AI: Branching to step ${nextBranchStepId}`);
          setTimeout(() => processStep(nextBranchStepId, updatedVars), 500);
        } else {
          logEvent("AI: No specific branch, ending or fallback.");
          processStep("end", updatedVars); // Default to end if no branch
        }
        break;
      case "END_CALL":
        const endMsg = replacePlaceholders(step.message || "Call ended.", vars);
        setCurrentBotMessage(endMsg);
        logEvent(`SYSTEM: ${endMsg}`);
        setIsSimulating(false);
        setExpectedUserIntents([]);
        break;
      default:
        logEvent(`ERROR: Unknown step type for step ID "${stepId}"`);
        setIsSimulating(false);
    }
  };

  const handleStartSimulation = () => {
    if (!selectedClientId || !selectedCampaignId) {
      toast({ title: "Setup Required", description: "Please select a client and campaign/agent.", variant: "destructive" });
      return;
    }
    try {
        const parsedVars = JSON.parse(initialVariables);
        setCurrentVariables(parsedVars);
        logEvent("--- Simulation Started ---");
        logEvent(`Client: ${mockClients.find(c=>c.id === selectedClientId)?.name}, Campaign: ${availableCampaigns.find(ct=>ct.id === selectedCampaignId)?.name}`);
        logEvent(`Contact: ${customerName} (${customerPhone})`);
        logEvent(`Initial Vars: ${JSON.stringify(parsedVars)}`);
        setIsSimulating(true);
        setDetectedIntent(null);
        setNextAction(null);
        processStep("start", parsedVars); // Start with the 'start' step
        toast({ title: "Simulation Started", description: "Follow the call flow steps." });
    } catch (e) {
        toast({ title: "Invalid JSON", description: "Initial variables must be valid JSON.", variant: "destructive"});
        logEvent("ERROR: Invalid JSON in initial variables.");
    }
  };
  
  const handleResetSimulation = () => {
    setIsSimulating(false);
    setCurrentStepId(null);
    setCurrentBotMessage("");
    setExpectedUserIntents([]);
    setUserResponse("");
    setDetectedIntent(null);
    setNextAction(null);
    setSimulationLog(["--- Simulation Reset ---"]);
    setCurrentVariables({});
    toast({ title: "Simulation Reset" });
  };

  const handleUserResponse = (isInvalidInput = false) => {
    if (!isSimulating || !currentStepId) return;
    const currentStep = sampleCallFlow[currentStepId];
    if (currentStep?.type !== "USER_INPUT_EXPECTED") {
      logEvent("SYSTEM: Not expecting user input at this step.");
      return;
    }

    if (isInvalidInput) {
      logEvent(`USER (Simulated Invalid): <Error Input>`);
      const fallbackId = currentStep.fallbackStepId || "fallback_general";
      logEvent(`SYSTEM: Triggering fallback to step: ${fallbackId}`);
      setDetectedIntent("Invalid Input");
      setNextAction(`Fallback to ${fallbackId}`);
      processStep(fallbackId, currentVariables);
    } else {
      logEvent(`USER: ${userResponse}`);
      // Mock intent detection: try to match response to an expected intent, or default
      let matchedIntent = currentStep.expectedIntents?.find(intent => userResponse.toLowerCase().includes(intent.replace(/_/g, " "))) || "default";
      
      // Try to find specific branch for this intent
      const decisionStepKey = Object.keys(sampleCallFlow).find(key => key.startsWith(matchedIntent + "_branch"));
      
      if (decisionStepKey) {
          logEvent(`SYSTEM: Matched intent "${matchedIntent}". Proceeding to decision step: ${decisionStepKey}`);
          setDetectedIntent(matchedIntent);
          setNextAction(`Process ${decisionStepKey}`);
          processStep(decisionStepKey, currentVariables);
      } else {
          logEvent(`SYSTEM: No specific branch for intent "${matchedIntent}". Using fallback or generic handler.`);
          const fallbackId = currentStep.fallbackStepId || "fallback_general";
          setDetectedIntent(matchedIntent + " (No specific branch)");
          setNextAction(`Fallback to ${fallbackId}`);
          processStep(fallbackId, currentVariables);
      }
    }
    setUserResponse(""); // Clear input after sending
  };


  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <FlaskConical className="mr-3 h-8 w-8 text-primary" /> Test Lab: Simulate Call Flow
          </h1>
          <p className="text-muted-foreground">
            Visually test your campaign’s call journey without initiating real calls.
          </p>
        </div>
         <Button onClick={isSimulating ? handleResetSimulation : handleStartSimulation} size="lg">
          {isSimulating ? <RotateCcw className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
          {isSimulating ? "Reset Simulation" : "Start Simulation"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Simulation Setup</CardTitle>
          <CardDescription>Configure the parameters for your test call.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="select-client">Client</Label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId} disabled={isSimulating}>
              <SelectTrigger id="select-client"><SelectValue placeholder="Select a client" /></SelectTrigger>
              <SelectContent>{mockClients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="select-campaign">Campaign / AI Agent</Label>
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId} disabled={!selectedClientId || isSimulating}>
              <SelectTrigger id="select-campaign"><SelectValue placeholder="Select campaign/agent" /></SelectTrigger>
              <SelectContent>
                {availableCampaigns.length > 0 ? 
                  availableCampaigns.map(ct => <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>) :
                  <SelectItem value="none" disabled>No agents for this client</SelectItem>
                }
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-name">Customer Name</Label>
            <Input id="customer-name" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g., John Doe" disabled={isSimulating}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-phone">Sample Phone Number</Label>
            <Input id="customer-phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="e.g., 555-000-1111" disabled={isSimulating}/>
          </div>
          <div className="space-y-2 md:col-span-2 lg:col-span-1">
            <Label htmlFor="initial-variables">Optional Input Parameters (JSON)</Label>
            <Textarea id="initial-variables" value={initialVariables} onChange={e => setInitialVariables(e.target.value)} placeholder='{ "product_interest": "premium" }' className="min-h-[80px] font-mono text-xs" disabled={isSimulating}/>
          </div>
        </CardContent>
      </Card>

      {isSimulating && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center"><MessageSquare className="mr-2 h-5 w-5"/>Current AI Dialogue</CardTitle></CardHeader>
              <CardContent className="min-h-[80px]">
                <p className="text-lg">{currentBotMessage || "Waiting for simulation to start..."}</p>
                {expectedUserIntents.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">Listening for intents:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {expectedUserIntents.map(intent => <Badge key={intent} variant="secondary">{intent}</Badge>)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
                <CardHeader><CardTitle className="flex items-center"><Zap className="mr-2 h-5 w-5"/>User Interaction</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <Input 
                        value={userResponse} 
                        onChange={e => setUserResponse(e.target.value)}
                        placeholder="Type user's response here..."
                        disabled={!isSimulating || sampleCallFlow[currentStepId!]?.type !== "USER_INPUT_EXPECTED"}
                        onKeyPress={(e) => e.key === 'Enter' && handleUserResponse()}
                    />
                    <div className="flex gap-2">
                        <Button onClick={() => handleUserResponse()} disabled={!isSimulating || sampleCallFlow[currentStepId!]?.type !== "USER_INPUT_EXPECTED"}>
                            <LogIn className="mr-2 h-4 w-4"/>Send Response
                        </Button>
                        <Button variant="outline" onClick={() => handleUserResponse(true)} disabled={!isSimulating || sampleCallFlow[currentStepId!]?.type !== "USER_INPUT_EXPECTED"}>
                            <AlertOctagon className="mr-2 h-4 w-4"/>Simulate Invalid Input
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5"/>Visual Node-based Flow (Placeholder)</CardTitle></CardHeader>
              <CardContent>
                <Image src="https://placehold.co/600x300.png?text=Call+Flow+Diagram" alt="Placeholder: Flowchart diagram of call flow" width={600} height={300} className="rounded-md border w-full" data-ai-hint="flowchart diagram"/>
                <p className="text-xs text-muted-foreground mt-2">This area would display a visual representation of the call script and current active node.</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center"><ChevronRight className="mr-2 h-5 w-5"/>AI Decision Output</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Detected Intent:</strong> <Badge variant={detectedIntent ? "default" : "outline"}>{detectedIntent || "N/A"}</Badge></p>
                <p><strong>Next Action / State:</strong> {nextAction || "N/A"}</p>
                 <div>
                    <strong>Current Variables:</strong>
                    <ScrollArea className="h-[100px] mt-1 p-2 border rounded-md bg-muted/50">
                      <pre className="text-xs font-mono">{JSON.stringify(currentVariables, null, 2)}</pre>
                    </ScrollArea>
                 </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col max-h-[calc(100vh-200px)] h-full"> {/* Adjusted height for log view */}
              <CardHeader><CardTitle className="flex items-center"><Terminal className="mr-2 h-5 w-5"/>Real-time Log</CardTitle></CardHeader>
              <CardContent className="flex-grow overflow-hidden p-0">
                <ScrollArea className="h-full p-3">
                  <div className="space-y-1 text-xs font-mono">
                    {simulationLog.map((log, i) => <p key={i} className="whitespace-pre-wrap break-all">{log}</p>)}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
