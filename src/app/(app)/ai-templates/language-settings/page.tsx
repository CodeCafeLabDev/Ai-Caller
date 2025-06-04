
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit3, Trash2, Languages, Settings, BookOpen, Mic, SlidersHorizontal, CheckCircle } from "lucide-react";

interface LanguageSetting {
  id: string;
  name: string;
  code: string; // e.g., "en-US", "es-ES"
  ttsEngine: string;
  voice: string;
  speed?: number;
  pitch?: number;
  isDefault?: boolean;
}

const allPossibleLanguages = [
  { id: "lang_en_us", name: "English (United States)", code: "en-US" },
  { id: "lang_es_es", name: "Spanish (Spain)", code: "es-ES" },
  { id: "lang_fr_fr", name: "French (France)", code: "fr-FR" },
  { id: "lang_de_de", name: "German (Germany)", code: "de-DE" },
  { id: "lang_hi_in", name: "Hindi (India)", code: "hi-IN" },
  { id: "lang_ja_jp", name: "Japanese (Japan)", code: "ja-JP" },
];

const mockTtsEngines = ["System Default", "Google Cloud TTS", "Amazon Polly", "Microsoft Azure TTS"];
const mockVoices = ["Standard Male", "Standard Female", "Neural Male", "Neural Female"];

const initialSupportedLanguages: LanguageSetting[] = [
  { id: "lang_en_us", name: "English (United States)", code: "en-US", ttsEngine: "Google Cloud TTS", voice: "Neural Female", isDefault: true, speed: 1, pitch: 1 },
  { id: "lang_es_es", name: "Spanish (Spain)", code: "es-ES", ttsEngine: "System Default", voice: "Standard Male", speed: 1, pitch: 1 },
];

export default function AiTemplateLanguageSettingsPage() {
  const { toast } = useToast();
  const [supportedLanguages, setSupportedLanguages] = React.useState<LanguageSetting[]>(initialSupportedLanguages);
  const [defaultLanguageId, setDefaultLanguageId] = React.useState<string | undefined>(
    initialSupportedLanguages.find(lang => lang.isDefault)?.id
  );
  const [enableFallback, setEnableFallback] = React.useState(false);
  const [fallbackLanguageId, setFallbackLanguageId] = React.useState<string | undefined>();

  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = React.useState(false);
  const [currentLangToConfig, setCurrentLangToConfig] = React.useState<LanguageSetting | null>(null);
  
  // Form state for Add/Config dialogs
  const [selectedLangCode, setSelectedLangCode] = React.useState<string>("");
  const [selectedTtsEngine, setSelectedTtsEngine] = React.useState<string>("");
  const [selectedVoice, setSelectedVoice] = React.useState<string>("");
  const [currentSpeed, setCurrentSpeed] = React.useState<number>(1);
  const [currentPitch, setCurrentPitch] = React.useState<number>(1);


  const languagesAvailableToAdd = allPossibleLanguages.filter(
    (lang) => !supportedLanguages.some((supported) => supported.id === lang.id)
  );

  const handleAddLanguage = () => {
    if (!selectedLangCode || !selectedTtsEngine || !selectedVoice) {
      toast({ title: "Missing fields", description: "Please select language, TTS engine, and voice.", variant: "destructive" });
      return;
    }
    const langToAdd = allPossibleLanguages.find(l => l.code === selectedLangCode);
    if (langToAdd) {
      const newLang: LanguageSetting = {
        id: langToAdd.id,
        name: langToAdd.name,
        code: langToAdd.code,
        ttsEngine: selectedTtsEngine,
        voice: selectedVoice,
        speed: 1, pitch: 1
      };
      setSupportedLanguages(prev => [...prev, newLang]);
      toast({ title: "Language Added", description: `${newLang.name} has been added.` });
      setIsAddDialogOpen(false);
      resetDialogForm();
    }
  };
  
  const handleOpenConfigDialog = (lang: LanguageSetting) => {
    setCurrentLangToConfig(lang);
    setSelectedLangCode(lang.code); // Not for change, just for display
    setSelectedTtsEngine(lang.ttsEngine);
    setSelectedVoice(lang.voice);
    setCurrentSpeed(lang.speed || 1);
    setCurrentPitch(lang.pitch || 1);
    setIsConfigDialogOpen(true);
  };

  const handleSaveConfig = () => {
    if (!currentLangToConfig || !selectedTtsEngine || !selectedVoice) {
      toast({ title: "Missing fields", description: "TTS engine and voice are required.", variant: "destructive" });
      return;
    }
    setSupportedLanguages(prev => 
      prev.map(lang => 
        lang.id === currentLangToConfig.id 
        ? { ...lang, ttsEngine: selectedTtsEngine, voice: selectedVoice, speed: currentSpeed, pitch: currentPitch } 
        : lang
      )
    );
    toast({ title: "Configuration Saved", description: `Settings for ${currentLangToConfig.name} updated.` });
    setIsConfigDialogOpen(false);
    resetDialogForm();
  };

  const resetDialogForm = () => {
    setSelectedLangCode("");
    setSelectedTtsEngine("");
    setSelectedVoice("");
    setCurrentSpeed(1);
    setCurrentPitch(1);
    setCurrentLangToConfig(null);
  };

  const handleRemoveLanguage = (langId: string) => {
    const langToRemove = supportedLanguages.find(l => l.id === langId);
    setSupportedLanguages(prev => prev.filter(lang => lang.id !== langId));
    if (defaultLanguageId === langId) {
        setDefaultLanguageId(supportedLanguages.length > 1 ? supportedLanguages.filter(l => l.id !== langId)[0].id : undefined);
    }
    toast({ title: "Language Removed", description: `${langToRemove?.name} has been removed.`, variant: "destructive" });
  };

  const handleSetDefault = (langId: string) => {
    setDefaultLanguageId(langId);
    setSupportedLanguages(prev => prev.map(lang => ({ ...lang, isDefault: lang.id === langId })));
    toast({ title: "Default Language Set", description: `${supportedLanguages.find(l => l.id === langId)?.name} is now the default.` });
  };
  
  const handleDefaultSystemLangChange = (langId: string) => {
    handleSetDefault(langId);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <Languages className="mr-3 h-8 w-8 text-primary" /> AI Template Language Settings
        </h1>
        <p className="text-muted-foreground">
          Manage language support, TTS configurations, and localization for your AI templates.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Language Settings</CardTitle>
            <CardDescription>Configure global language preferences for your system.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="default-system-language">Default System Language</Label>
              <Select value={defaultLanguageId} onValueChange={handleDefaultSystemLangChange}>
                <SelectTrigger id="default-system-language">
                  <SelectValue placeholder="Select default language" />
                </SelectTrigger>
                <SelectContent>
                  {supportedLanguages.map((lang) => (
                    <SelectItem key={lang.id} value={lang.id}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="enable-fallback" className="text-base">Enable Fallback Language</Label>
                <p className="text-sm text-muted-foreground">
                  If a template isn't available in the target language, use this fallback.
                </p>
              </div>
              <Switch id="enable-fallback" checked={enableFallback} onCheckedChange={setEnableFallback} />
            </div>
            {enableFallback && (
              <div className="space-y-2">
                <Label htmlFor="fallback-language">Fallback Language</Label>
                <Select value={fallbackLanguageId} onValueChange={setFallbackLanguageId}>
                  <SelectTrigger id="fallback-language">
                    <SelectValue placeholder="Select fallback language" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLanguages
                      .filter(lang => lang.id !== defaultLanguageId) // Cannot be same as default
                      .map((lang) => (
                      <SelectItem key={lang.id} value={lang.id}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Voice & TTS Engine Defaults</CardTitle>
                <CardDescription>Set global defaults for Text-to-Speech. Can be overridden per language.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Default TTS Engine (Mock)</Label>
                    <Select defaultValue="System Default">
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>{mockTtsEngines.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Default Voice (Mock)</Label>
                    <Select defaultValue="Standard Female">
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>{mockVoices.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label>Default Speech Speed (Mock)</Label>
                    <Input type="number" defaultValue={1} step={0.1} min={0.5} max={2}/>
                </div>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Supported Languages & TTS Configuration</CardTitle>
              <CardDescription>Manage languages available for AI templates and their specific TTS settings.</CardDescription>
            </div>
            <Button onClick={() => { resetDialogForm(); setIsAddDialogOpen(true); }} disabled={languagesAvailableToAdd.length === 0}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Language
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Language</TableHead>
                <TableHead>TTS Engine</TableHead>
                <TableHead>Voice</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supportedLanguages.length > 0 ? supportedLanguages.map((lang) => (
                <TableRow key={lang.id}>
                  <TableCell className="font-medium">{lang.name} ({lang.code})</TableCell>
                  <TableCell>{lang.ttsEngine}</TableCell>
                  <TableCell>{lang.voice}</TableCell>
                  <TableCell>
                    {lang.isDefault && <Badge><CheckCircle className="mr-1 h-3 w-3"/>Default</Badge>}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenConfigDialog(lang)}>
                      <Settings className="mr-1 h-3 w-3" /> Configure
                    </Button>
                    {!lang.isDefault && (
                        <Button variant="outline" size="sm" onClick={() => handleSetDefault(lang.id)}>
                            Set Default
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveLanguage(lang.id)} disabled={lang.isDefault && supportedLanguages.length === 1}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No languages supported yet. Click "Add Language" to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><BookOpen className="mr-2 h-5 w-5"/>Advanced: Phrase Dictionaries (Localization)</CardTitle>
          <CardDescription>
            Manage custom phrase translations for specific languages to improve localization and AI understanding. (Placeholder)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Future development will include tools to upload, manage, and version phrase dictionaries.
            This could involve key-value stores for common phrases like greetings, confirmations, or industry-specific jargon,
            allowing for fine-tuned AI responses in different linguistic contexts.
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" disabled>Upload Dictionary (JSON/CSV)</Button>
            <Button variant="outline" disabled>Create New Dictionary</Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Language Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Supported Language</DialogTitle>
            <DialogDescription>Select a language and configure its initial TTS settings.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-lang-select">Language</Label>
              <Select value={selectedLangCode} onValueChange={setSelectedLangCode}>
                <SelectTrigger id="add-lang-select">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  {languagesAvailableToAdd.map(lang => (
                    <SelectItem key={lang.id} value={lang.code}>{lang.name} ({lang.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-lang-tts">TTS Engine</Label>
              <Select value={selectedTtsEngine} onValueChange={setSelectedTtsEngine}>
                <SelectTrigger id="add-lang-tts">
                  <SelectValue placeholder="Select TTS Engine" />
                </SelectTrigger>
                <SelectContent>{mockTtsEngines.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-lang-voice">Voice</Label>
               <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger id="add-lang-voice">
                  <SelectValue placeholder="Select Voice" />
                </SelectTrigger>
                <SelectContent>{mockVoices.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" onClick={resetDialogForm}>Cancel</Button></DialogClose>
            <Button type="button" onClick={handleAddLanguage}>Add Language</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configure Language Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure: {currentLangToConfig?.name}</DialogTitle>
            <DialogDescription>Adjust TTS settings for this language.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="config-lang-tts">TTS Engine</Label>
              <Select value={selectedTtsEngine} onValueChange={setSelectedTtsEngine}>
                <SelectTrigger id="config-lang-tts"><SelectValue placeholder="Select TTS Engine" /></SelectTrigger>
                <SelectContent>{mockTtsEngines.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="config-lang-voice">Voice</Label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger id="config-lang-voice"><SelectValue placeholder="Select Voice" /></SelectTrigger>
                <SelectContent>{mockVoices.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="config-lang-speed">Speech Speed (0.5 - 2.0)</Label>
                    <Input id="config-lang-speed" type="number" value={currentSpeed} onChange={e => setCurrentSpeed(parseFloat(e.target.value))} step="0.1" min="0.5" max="2.0" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="config-lang-pitch">Speech Pitch (-10 to 10)</Label>
                    <Input id="config-lang-pitch" type="number" value={currentPitch} onChange={e => setCurrentPitch(parseFloat(e.target.value))} step="0.5" min="-10" max="10" />
                </div>
            </div>
            <p className="text-xs text-muted-foreground">Note: Speed and Pitch controls are illustrative. Actual supported ranges depend on the TTS engine.</p>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" onClick={resetDialogForm}>Cancel</Button></DialogClose>
            <Button type="button" onClick={handleSaveConfig}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

    