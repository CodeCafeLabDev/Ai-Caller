
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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Languages, Play, Upload, Mic, Volume2, AlertTriangle, BarChartHorizontalBig, Sparkles, Download, Users, Speaker } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Mock data for voices and languages
const mockVoices = [
  { id: "voice_male_us_1", name: "Standard Male (US)", gender: "Male", langRegion: "en-US" },
  { id: "voice_female_us_1", name: "Standard Female (US)", gender: "Female", langRegion: "en-US" },
  { id: "voice_neural_male_in_1", name: "Neural Male (India)", gender: "Male", langRegion: "hi-IN" },
  { id: "voice_neural_female_gb_1", name: "Neural Female (UK)", gender: "Female", langRegion: "en-GB" },
];

const mockLanguagesRegions = [
  { id: "en-US", name: "English (United States)" },
  { id: "hi-IN", name: "Hindi (India)" },
  { id: "en-GB", name: "English (United Kingdom)" },
  { id: "es-ES", name: "Spanish (Spain)" },
];


export default function VoiceBotTestingPage() {
  const { toast } = useToast();
  const [ttsText, setTtsText] = React.useState("Hello, this is a test of the Text-to-Speech engine.");
  const [selectedVoice, setSelectedVoice] = React.useState(mockVoices[0].id);
  const [selectedLanguage, setSelectedLanguage] = React.useState(mockLanguagesRegions[0].id);
  
  const [confidenceScore, setConfidenceScore] = React.useState(0);
  const [mispronunciations, setMispronunciations] = React.useState<string[]>([]);

  const handlePlayTTS = () => {
    const voice = mockVoices.find(v => v.id === selectedVoice);
    toast({
      title: "Simulating TTS Playback",
      description: `Playing: "${ttsText}" with voice ${voice?.name}.`,
    });
    // In a real app, this would trigger audio playback
  };

  const handleStartConversationSim = () => {
    toast({ title: "Conversation Simulation Started", description: "Full audio conversation simulation initiated (mocked)." });
  };
  
  const handleTestFallback = () => {
     toast({ title: "Fallback Trigger Test", description: "Simulating scenario to test fallback logic (mocked)." });
  };
  
  const handleExportSample = () => {
    toast({ title: "Export Voice Sample", description: "MP3 export initiated (mocked)." });
  };

  const handleCompareVoices = () => {
     toast({ title: "Compare Voices", description: "A/B voice comparison started (mocked)." });
  };

  // Simulate AI Evaluation update
  React.useEffect(() => {
    const interval = setInterval(() => {
      setConfidenceScore(Math.floor(Math.random() * 30) + 70); // Random score between 70-100
      setMispronunciations(Math.random() > 0.7 ? ["example", "specific"] : []);
    }, 3000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <Languages className="mr-3 h-8 w-8 text-primary" /> Voice Bot Testing
        </h1>
        <p className="text-muted-foreground">
          Test Text-to-Speech, Speech-to-Text, and evaluate AI voice interactions.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center"><Speaker className="mr-2 h-5 w-5"/>Text-to-Speech (TTS) Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="select-voice">Select Voice</Label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger id="select-voice"><SelectValue /></SelectTrigger>
                  <SelectContent>{mockVoices.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="select-language">Select Language/Region</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger id="select-language"><SelectValue /></SelectTrigger>
                  <SelectContent>{mockLanguagesRegions.map(lr => <SelectItem key={lr.id} value={lr.id}>{lr.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="tts-text">Text to Synthesize</Label>
              <Textarea id="tts-text" value={ttsText} onChange={e => setTtsText(e.target.value)} placeholder="Enter text for TTS preview..." className="min-h-[100px]" />
            </div>
            <Button onClick={handlePlayTTS}><Play className="mr-2 h-4 w-4" /> Play TTS Sample</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><BarChartHorizontalBig className="mr-2 h-5 w-5"/>AI Evaluation Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>STT Confidence Score</Label>
              <div className="flex items-center gap-2">
                <Progress value={confidenceScore} className="h-3" />
                <span className="text-sm font-semibold">{confidenceScore}%</span>
              </div>
            </div>
            <div>
              <Label>Mispronunciation Detection</Label>
              {mispronunciations.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {mispronunciations.map(word => <Badge key={word} variant="destructive">{word}</Badge>)}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No mispronunciations detected.</p>
              )}
            </div>
            <Button onClick={handleTestFallback} variant="outline" className="w-full">
              <AlertTriangle className="mr-2 h-4 w-4" /> Test Fallback Trigger
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Volume2 className="mr-2 h-5 w-5"/>Audio Simulation</CardTitle>
          <CardDescription>Simulate a full conversation with TTS playback and test STT with sample user responses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="grid sm:grid-cols-2 gap-4 items-end">
                <Button onClick={handleStartConversationSim} size="lg" className="w-full sm:w-auto">
                    Start Full Conversation Simulation
                </Button>
                <div className="space-y-2">
                    <Label htmlFor="upload-response">Upload User Response (Audio File)</Label>
                    <Input id="upload-response" type="file" accept="audio/*" />
                </div>
           </div>
            <div className="mt-4 p-4 border rounded-md bg-muted/50 min-h-[100px]">
              <Label>Conversation Visualizer (Placeholder)</Label>
              <p className="text-sm text-muted-foreground">This area would show simulated pauses, detected tone, and speech speed metrics during the conversation simulation.</p>
              <div className="flex mt-2 gap-4">
                <Badge variant="outline">Pause: 1.2s</Badge>
                <Badge variant="outline">Tone: Neutral</Badge>
                <Badge variant="outline">Speed: 150 WPM</Badge>
              </div>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center"><Sparkles className="mr-2 h-5 w-5"/>Enhancements & Advanced Testing</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
                <h4 className="font-semibold">Export & Comparison</h4>
                <Button onClick={handleExportSample} variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" /> Export Voice Sample (MP3)
                </Button>
                 <Button onClick={handleCompareVoices} variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" /> Compare Voices (A/B Test)
                </Button>
            </div>
             <div className="space-y-3 p-4 border rounded-md">
                <h4 className="font-semibold">A/B Voice Comparison Setup (Mock)</h4>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <Label htmlFor="voice-a" className="text-xs">Voice A</Label>
                        <Select defaultValue={mockVoices[0].id}><SelectTrigger id="voice-a" className="h-8"><SelectValue/></SelectTrigger><SelectContent>{mockVoices.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div>
                        <Label htmlFor="voice-b" className="text-xs">Voice B</Label>
                        <Select defaultValue={mockVoices[1].id}><SelectTrigger id="voice-b" className="h-8"><SelectValue/></SelectTrigger><SelectContent>{mockVoices.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select>
                    </div>
                </div>
                <Button onClick={handleCompareVoices} size="sm" className="w-full mt-2">Compare Selected Voices</Button>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
