"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PlusCircle, Trash2, ChevronDown } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import languagesData from "@/data/languages.json";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { api } from "@/lib/apiConfig";
import { useToast } from "@/components/ui/use-toast";

// Remove image upload and emoji flag logic
// Add flag image fetching using flagcdn.com
// Make the language dropdown searchable

// Remove initialLanguageOptions and related logic
// Use languagesData (sorted by name) for dropdown and table
const sortedLanguagesData = languagesData
  .map((lang, idx) => ({ id: idx + 1, ...lang }))
  .sort((a, b) => a.name.localeCompare(b.name));

export default function SupportedLanguagesPage() {
  const [languages, setLanguages] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState("latest");
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedLangId, setSelectedLangId] = React.useState<number | null>(null);
  const [enableSwitch, setEnableSwitch] = React.useState(true);
  const [dropdownSearch, setDropdownSearch] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<number | null>(null);
  const { toast } = useToast();

  // Fetch languages from backend
  React.useEffect(() => {
    api.getLanguages()
      .then(res => res.json())
      .then(data => setLanguages(data.data || []))
      .catch(() => setLanguages([]));
  }, []);

  // Add language
  const handleAddLanguage = async () => {
    if (selectedLangId == null) return;
    const lang = sortedLanguagesData.find(l => l.id === selectedLangId);
    if (!lang) return;
    const payload = {
      name: lang.name,
      code: lang.code,
      country_code: lang.countryCode,
      calling_code: lang.callingCode,
      enabled: enableSwitch,
    };
    const res = await api.createLanguage(payload);
    const newLang = (await res.json()).data;
    setLanguages(prev => [...prev, newLang]);
    setIsSheetOpen(false);
    setSelectedLangId(null);
    setEnableSwitch(true);
    setDropdownSearch("");
  };

  // Enable/disable
  const handleToggle = async (id: number, enabled: boolean) => {
    const res = await api.updateLanguage(id.toString(), { enabled });
    const updated = (await res.json()).data;
    setLanguages(langs => langs.map(lang => lang.id === id ? updated : lang));
    toast({
      title: `Language ${enabled ? "enabled" : "disabled"}`,
      description: updated?.name ? `${updated.name} has been ${enabled ? "enabled" : "disabled"}.` : undefined,
    });
  };

  // Delete
  const handleDelete = async (id: number) => {
    setDeleteDialogOpen(true);
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (pendingDeleteId == null) return;
    await api.deleteLanguage(pendingDeleteId.toString());
    setLanguages(langs => langs.filter(lang => lang.id !== pendingDeleteId));
    setDeleteDialogOpen(false);
    setPendingDeleteId(null);
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setPendingDeleteId(null);
  };

  const filtered = languages
    .filter(lang => lang.name.toLowerCase().includes(search.toLowerCase()) || lang.code.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "alphabetical") return a.name.localeCompare(b.name);
      return b.id - a.id; // latest by id
    });

  // Filter dropdown options by dropdownSearch
  const filteredDropdownOptions = sortedLanguagesData.filter(opt =>
    !languages.some(l => l.code === opt.code) &&
    (opt.name.toLowerCase().includes(dropdownSearch.toLowerCase()) || opt.code.toLowerCase().includes(dropdownSearch.toLowerCase()))
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold">Supported Languages</h1>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button className="flex items-center gap-2" variant="default">
              <PlusCircle className="h-5 w-5" /> Add Language
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Add Language</SheetTitle>
            </SheetHeader>
            <form className="space-y-6 mt-4" onSubmit={e => { e.preventDefault(); handleAddLanguage(); }}>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={selectedLangId ? String(selectedLangId) : ""} onValueChange={val => setSelectedLangId(Number(val))}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1">
                      <Input
                        placeholder="Search languages..."
                        value={dropdownSearch}
                        onChange={e => setDropdownSearch(e.target.value)}
                        className="w-full mb-2"
                        autoFocus
                      />
                    </div>
                    {filteredDropdownOptions.length === 0 && (
                      <div className="px-4 py-2 text-muted-foreground text-sm">No languages found.</div>
                    )}
                    {filteredDropdownOptions.filter(opt => opt.id).map(opt => (
                      <SelectItem key={opt.id} value={String(opt.id)}>
                        <span className="flex items-center gap-2">
                          <img
                            src={`https://flagcdn.com/24x18/${opt.countryCode}.png`}
                            alt={opt.code}
                            className="h-4 w-6 rounded object-cover border"
                            style={{ minWidth: 24 }}
                          />
                          {opt.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
                <div className="space-y-2">
                <Label htmlFor="country-code">Country Code</Label>
                <Input
                  id="country-code"
                  value={selectedLangId ? sortedLanguagesData.find(l => l.id === selectedLangId)?.code || '' : ''}
                  readOnly
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="calling-code">Calling Code</Label>
                <Input
                  id="calling-code"
                  value={selectedLangId ? sortedLanguagesData.find(l => l.id === selectedLangId)?.callingCode || '' : ''}
                  readOnly
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="enable-switch" checked={enableSwitch} onCheckedChange={setEnableSwitch} />
                <Label htmlFor="enable-switch">Enable</Label>
                </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </SheetClose>
                <Button type="submit" disabled={selectedLangId == null}>Add</Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
                </div>
      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between mb-4">
        <Input
          placeholder="Search languages..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 ml-0 sm:ml-2">
              Sort: {sort === "latest" ? "Latest" : "Alphabetical"} <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSort("latest")}>Latest</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSort("alphabetical")}>Alphabetical</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Language</TableHead>
                <TableHead>Country Code</TableHead>
                <TableHead>Calling Code</TableHead>
                <TableHead>Enable</TableHead>
                <TableHead>Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? filtered.map(lang => (
                <TableRow key={lang.id}>
                  <TableCell className="flex items-center gap-2 font-medium">
                    <img
                      src={`https://flagcdn.com/24x18/${lang.country_code}.png`}
                      alt={lang.code}
                      className="h-4 w-6 rounded object-cover border"
                      style={{ minWidth: 24 }}
                    />
                    {lang.name}
                  </TableCell>
                  <TableCell>{lang.code}</TableCell>
                  <TableCell>{lang.calling_code}</TableCell>
                  <TableCell>
                    <Switch checked={lang.enabled} onCheckedChange={checked => handleToggle(lang.id, checked)} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(lang.id)}>
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No languages found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Language</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete this language? This action cannot be undone.</div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
