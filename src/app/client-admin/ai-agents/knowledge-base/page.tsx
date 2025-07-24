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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Search, PlusCircle, Edit2, Eye, Archive, BookOpen, Check, ChevronsUpDown, ListFilter, ClipboardCopy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/cn";
import { Globe, FileText, Upload, MoreHorizontal, Download } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { useEffect, useState } from 'react';
import { Sheet, SheetHeader, SheetTitle, SheetFooter, SheetClose, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api, API_BASE_URL } from "@/lib/apiConfig";
import { useUser } from '@/lib/utils';


export default function KnowledgeBasePage() {
  const { toast } = useToast();
  const { user } = useUser();
  // Article type
  type KnowledgeBaseArticle = {
    id: string;
    type: string;
    name: string;
    size?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    client_id: string;
    url?: string;
    file_path?: string;
    text_content?: string;
  };

  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<"all">("all");
  const [statusFilter, setStatusFilter] = React.useState<"all">("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const [openDialog, setOpenDialog] = React.useState<null | 'url' | 'files' | 'text'>(null);
  const [typeFilter, setTypeFilter] = React.useState({ file: false, url: false, text: false });
  const [urlInput, setUrlInput] = useState("");
  const [textName, setTextName] = useState("");
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // 0 to 100
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeBaseArticle | null>(null);
  const [localMeta, setLocalMeta] = useState<{ [id: string]: any }>({});
  const [detailsSize, setDetailsSize] = useState<string | null>(null);

  // ElevenLabs API helpers
  const ELEVENLABS_API = 'https://api.elevenlabs.io/v1/convai/knowledge-base';
  const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '';

  async function fetchElevenLabsKnowledgeBase() {
    if (!ELEVENLABS_API_KEY) {
      toast({
        title: "Missing API Key",
        description: "Please set your ElevenLabs API key in the environment variables.",
        variant: "destructive",
      });
      return [];
    }
    const res = await fetch(ELEVENLABS_API, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      } as HeadersInit,
    });
    if (res.status === 401) {
      toast({
        title: "Unauthorized",
        description: "Your ElevenLabs API key is missing or invalid.",
        variant: "destructive",
      });
      return [];
    }
    const data = await res.json();
    console.log('ElevenLabs KB API response:', data); // Debug log
    // Try all possible array properties, fallback to []
    if (Array.isArray(data.knowledge_bases)) return data.knowledge_bases;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.documents)) return data.documents;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  }

  async function fetchElevenLabsDocument(id: string) {
    if (!ELEVENLABS_API_KEY) {
      toast({
        title: "Missing API Key",
        description: "Please set your ElevenLabs API key in the environment variables.",
        variant: "destructive",
      });
      return null;
    }
    const res = await fetch(`${ELEVENLABS_API}/${id}`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      } as HeadersInit,
    });
    if (res.status === 401) {
      toast({
        title: "Unauthorized",
        description: "Your ElevenLabs API key is missing or invalid.",
        variant: "destructive",
      });
      return null;
    }
    return await res.json();
  }

  async function updateElevenLabsDocument(id: string, updatePayload: any) {
    if (!ELEVENLABS_API_KEY) {
      toast({
        title: "Missing API Key",
        description: "Please set your ElevenLabs API key in the environment variables.",
        variant: "destructive",
      });
      return null;
    }
    const res = await fetch(`${ELEVENLABS_API}/${id}`, {
      method: 'PATCH',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      } as HeadersInit,
      body: JSON.stringify(updatePayload),
    });
    if (res.status === 401) {
      toast({
        title: "Unauthorized",
        description: "Your ElevenLabs API key is missing or invalid.",
        variant: "destructive",
      });
      return null;
    }
    return await res.json();
  }

  async function deleteElevenLabsDocument(id: string) {
    if (!ELEVENLABS_API_KEY) {
      toast({
        title: "Missing API Key",
        description: "Please set your ElevenLabs API key in the environment variables.",
        variant: "destructive",
      });
      return;
    }
    const res = await fetch(`${ELEVENLABS_API}/${id}`, {
      method: 'DELETE',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      } as HeadersInit,
    });
    if (res.status === 401) {
      toast({
        title: "Unauthorized",
        description: "Your ElevenLabs API key is missing or invalid.",
        variant: "destructive",
      });
    }
  }

  // Helper to add a knowledge base item to ElevenLabs and local DB
  async function addKnowledgeBaseItem(type: 'url' | 'text' | 'file', payload: any, apiKey: string, localDbPayload: any) {
    if (!apiKey) {
      toast({
        title: "Missing API Key",
        description: "Please set your ElevenLabs API key in the environment variables.",
        variant: "destructive",
      });
      return null;
    }
    let endpoint = '';
    if (type === 'url') endpoint = 'https://api.elevenlabs.io/v1/convai/knowledge-base/url';
    if (type === 'text') endpoint = 'https://api.elevenlabs.io/v1/convai/knowledge-base/text';
    if (type === 'file') endpoint = 'https://api.elevenlabs.io/v1/convai/knowledge-base/file';

    // Only send required fields to ElevenLabs
    let elevenLabsPayload = {};
    if (type === 'url') elevenLabsPayload = { url: payload.url, name: payload.name };
    if (type === 'text') elevenLabsPayload = { name: payload.name, text: payload.text_content || payload.text };
    if (type === 'file') elevenLabsPayload = { name: payload.name };

    // 1. Post to ElevenLabs
    const elevenRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      } as HeadersInit,
      body: JSON.stringify(elevenLabsPayload),
    });
    if (elevenRes.status === 401) {
      toast({
        title: "Unauthorized",
        description: "Your ElevenLabs API key is missing or invalid.",
        variant: "destructive",
      });
      return null;
    }
    const elevenData = await elevenRes.json();
    console.log('ElevenLabs response:', elevenData);

    // 2. Save to your local DB
    await api.createKnowledgeBaseItem(localDbPayload);

    return elevenData;
  }

  // Fetch articles on load (from local DB, not just ElevenLabs)
  useEffect(() => {
    api.getKnowledgeBase()
      .then(res => res.json())
      .then(data => setArticles(data.data || []));
  }, [user?.userId]);

  // Merge localMeta by url (or name if url is missing)
  async function fetchLocalMeta() {
    const res = await api.getKnowledgeBase();
    const data = await res.json();
    const metaMap: { [key: string]: any } = {};
    (data.data || []).forEach((item: any) => {
      if (item.url) metaMap[item.url] = item;
      else if (item.name) metaMap[item.name] = item;
    });
    setLocalMeta(metaMap);
  }

  useEffect(() => {
    fetchLocalMeta();
  }, []);

  const selectedTypes = Object.entries(typeFilter).filter(([_, v]) => v).map(([k]) => k);
  const typeLabels = { file: 'File', url: 'URL', text: 'Text' };
  const typeIcons = { file: Upload, url: Globe, text: FileText };

  // Filter articles to only show those for the current client admin
  const filteredArticles = articles.filter((article) =>
    String(article.client_id) === String(user?.userId)
  ).filter((article) => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const matchesSearch =
      (article.name?.toLowerCase() ?? '').includes(lowerSearchTerm);
    // Type filter logic
    const matchesType =
      selectedTypes.length === 0 || selectedTypes.includes(article.type);
    const matchesCategory = categoryFilter === "all" || article.type === categoryFilter;
    const matchesStatus = statusFilter === "all" || article.type === statusFilter;
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleArticleAction = (actionName: string, articleTitle: string) => {
    toast({
      title: `${actionName} (Simulated)`,
      description: `Action performed on article: ${articleTitle}.`,
    });
  };

  // Add document dialog handlers
  const [addDocLoading, setAddDocLoading] = useState(false);

  // When adding a knowledge base item, always use user.userId as client_id
  async function handleAddUrl() {
    setAddDocLoading(true);
    try {
      const localDbPayload = {
        client_id: user?.userId || null, // always use logged-in user id
        type: "url",
        name: urlInput,
        url: urlInput,
        file_path: null,
        text_content: null,
        size: null,
        created_by: "user@example.com", // replace with actual user email if available
      };
      await addKnowledgeBaseItem('url', { url: urlInput, name: urlInput }, ELEVENLABS_API_KEY, localDbPayload);
      setUrlInput("");
      setOpenDialog(null);
      const docs = await fetchElevenLabsKnowledgeBase();
      setArticles(docs);
      await fetchLocalMeta();
    } finally {
      setAddDocLoading(false);
    }
  }
  async function handleAddText() {
    setAddDocLoading(true);
    try {
      const localDbPayload = {
        client_id: user?.userId || null, // always use logged-in user id
        type: "text",
        name: textName,
        url: null,
        file_path: null,
        text_content: textContent,
        size: `${textContent.length} chars`,
        created_by: "user@example.com", // replace with actual user email if available
      };
      await addKnowledgeBaseItem('text', { name: textName, text: textContent }, ELEVENLABS_API_KEY, localDbPayload);
      setTextName("");
      setTextContent("");
      setOpenDialog(null);
      const docs = await fetchElevenLabsKnowledgeBase();
      setArticles(docs);
      await fetchLocalMeta();
    } finally {
      setAddDocLoading(false);
    }
  }
  async function handleAddFile() {
    if (!file) return;
    setAddDocLoading(true);
    try {
      const localDbPayload = {
        client_id: user?.userId || null, // always use logged-in user id
        type: "file",
        name: file.name,
        url: null,
        file_path: "/uploads/" + file.name, // replace with actual upload logic
        text_content: null,
        size: `${(file.size / 1024).toFixed(1)} kB`,
        created_by: "user@example.com", // replace with actual user email if available
      };
      await addKnowledgeBaseItem('file', { name: file.name }, ELEVENLABS_API_KEY, localDbPayload);
      setFile(null);
      setOpenDialog(null);
      const docs = await fetchElevenLabsKnowledgeBase();
      setArticles(docs);
      await fetchLocalMeta();
    } finally {
      setAddDocLoading(false);
    }
  }

  // Update delete handler to use ElevenLabs API and then local DB
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteElevenLabsDocument(String(id));
      // Optionally delete from local DB as well
      await api.deleteKnowledgeBaseItem(String(id));
      const docs = await fetchElevenLabsKnowledgeBase();
      setArticles(docs);
      await fetchLocalMeta();
      toast({ title: "Deleted", description: "Knowledge base item deleted." });
    } catch (err) {
      toast({ title: "Delete failed", description: "Network or server error.", variant: "destructive" });
    }
  };

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      toast({ title: "Copied", description: "Document ID copied to clipboard." });
    } catch (err) {
      toast({ title: "Copy failed", description: "Could not copy ID.", variant: "destructive" });
    }
  };

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsDoc, setDetailsDoc] = useState<any>(null);
  const [detailsContent, setDetailsContent] = useState<string>('');
  const [detailsAgents, setDetailsAgents] = useState<any[]>([]);
  const [detailsDocId, setDetailsDocId] = useState<string | null>(null);
  const [detailsLastUpdated, setDetailsLastUpdated] = useState<string | null>(null);

  // Add at the top of the file (or inside the component)
  function extractAllStrings(obj: any): string[] {
    let result: string[] = [];
    if (typeof obj === 'string' && obj.trim()) {
      result.push(obj);
    } else if (Array.isArray(obj)) {
      for (const item of obj) {
        result = result.concat(extractAllStrings(item));
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const value of Object.values(obj)) {
        result = result.concat(extractAllStrings(value));
      }
    }
    return result;
  }

  // Fetch details when a doc is selected
  async function openDetailsDrawer(article: any) {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsError(null);
    setDetailsDoc(article);
    setDetailsDocId(article.id || article.document_id || null);
    setDetailsLastUpdated(article.updated_at || article.last_updated || null);
    // Always fetch content and size for the selected document
    try {
      // Fetch content
      let content = '';
      try {
        const res = await fetch(`https://api.elevenlabs.io/v1/convai/knowledge-base/${article.id}/content`, {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          } as HeadersInit,
        });
        const data = await res.json();
        const allStrings = extractAllStrings(data);
        content = allStrings.join('\n\n');
      } catch (e) { content = ''; }
      setDetailsContent(content);
      // Fetch size
      let size = null;
      try {
        const res2 = await fetch(`https://api.elevenlabs.io/v1/convai/knowledge-base/${article.id}`, {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          } as HeadersInit,
        });
        const data2 = await res2.json();
        size = data2.size || data2.document_size || data2.length || null;
        if (!size && content) {
          size = `${content.length} chars`;
        }
      } catch {}
      setDetailsSize(size);
      // Fetch dependent agents
      let agents: any[] = [];
      try {
        const res = await fetch(`https://api.elevenlabs.io/v1/convai/knowledge-base/${article.id}/dependent-agents`, {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          } as HeadersInit,
        });
        const data = await res.json();
        agents = data.agents || data || [];
      } catch (e) { agents = []; }
      setDetailsAgents(agents);
      setDetailsLoading(false);
    } catch (err: any) {
      setDetailsError('Failed to load details.');
      setDetailsLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
      </div>
      <div className="flex gap-4 mb-6">
        <Dialog open={openDialog === 'url'} onOpenChange={v => setOpenDialog(v ? 'url' : null)}>
          <DialogTrigger asChild>
            <Button className="flex flex-col items-center justify-center w-40 h-28 gap-2 border bg-white shadow-none hover:bg-gray-50" variant="outline" onClick={() => setOpenDialog('url')}>
              <Globe className="w-7 h-7" />
              <span className="font-medium">Add URL</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden">
            <DialogTitle className="sr-only">Add URL</DialogTitle>
            <div className="flex flex-col gap-6 p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gray-100 rounded-xl p-2"><Globe className="w-7 h-7" /></div>
                <span className="text-2xl font-semibold">Add URL</span>
              </div>
              <div>
                <label className="block font-medium mb-2">URL</label>
                <Input placeholder="https://example.com" className="h-12 text-base" value={urlInput} onChange={e => setUrlInput(e.target.value)} />
              </div>
              <div className="flex justify-end">
                <Button 
                  className="bg-black text-white px-6 py-2 rounded-lg text-base" 
                  onClick={handleAddUrl}
                  disabled={addDocLoading || !urlInput}
                >
                  {addDocLoading ? 'Adding...' : 'Add URL'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={openDialog === 'files'} onOpenChange={v => setOpenDialog(v ? 'files' : null)}>
          <DialogTrigger asChild>
            <Button className="flex flex-col items-center justify-center w-40 h-28 gap-2 border bg-white shadow-none hover:bg-gray-50" variant="outline" onClick={() => setOpenDialog('files')}>
              <Upload className="w-7 h-7" />
              <span className="font-medium">Add Files</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden">
            <DialogTitle className="sr-only">Add Files</DialogTitle>
            <div className="flex flex-col gap-6 p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gray-100 rounded-xl p-2"><Upload className="w-7 h-7" /></div>
                <span className="text-2xl font-semibold">Add Files</span>
              </div>
              <div>
                <div
                  className="border-2 border-black border-dashed rounded-xl flex flex-col items-center justify-center py-12 mb-4 bg-white cursor-pointer"
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setFile(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <input
                    id="file-upload-input"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                  <Upload className="w-10 h-10 mb-2 text-black" />
                  <div className="font-medium text-lg mb-1">Click or drag files to upload</div>
                  <div className="text-gray-500 text-sm mb-2">Up to 21 MB each.</div>
                  {file && <div className="text-sm text-black font-semibold mb-2">{file.name}</div>}
                  <div className="flex gap-2 flex-wrap justify-center">
                    {['epub','pdf','docx','txt','html'].map(type => (
                      <span key={type} className="bg-gray-100 rounded-full px-3 py-1 text-xs font-medium text-gray-700">{type}</span>
                    ))}
                  </div>
                </div>
                {fileUploading ? (
                  <div className="w-full flex flex-col items-center">
                    <div className="w-3/4 bg-gray-200 rounded-full h-3 mb-2">
                      <div
                        className="bg-black h-3 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-700">{uploadProgress}%</div>
                  </div>
                ) : (
                  <Button
                    className="bg-black text-white px-6 py-2 rounded-lg text-base"
                    onClick={handleAddFile}
                    disabled={!file || addDocLoading}
                  >
                    {addDocLoading ? 'Adding...' : 'Add File'}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={openDialog === 'text'} onOpenChange={v => setOpenDialog(v ? 'text' : null)}>
          <DialogTrigger asChild>
            <Button className="flex flex-col items-center justify-center w-40 h-28 gap-2 border bg-white shadow-none hover:bg-gray-50" variant="outline" onClick={() => setOpenDialog('text')}>
              <FileText className="w-7 h-7" />
              <span className="font-medium">Create Text</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden">
            <DialogTitle className="sr-only">Create Text</DialogTitle>
            <div className="flex flex-col gap-6 p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gray-100 rounded-xl p-2"><FileText className="w-7 h-7" /></div>
                <span className="text-2xl font-semibold">Create Text</span>
              </div>
              <div>
                <label className="block font-medium mb-2">Text Name</label>
                <Input placeholder="Enter a name for your text" className="h-12 text-base" value={textName} onChange={e => setTextName(e.target.value)} />
              </div>
              <div>
                <label className="block font-medium mb-2">Text Content</label>
                <Textarea placeholder="Enter your text content here" className="min-h-[120px] text-base" value={textContent} onChange={e => setTextContent(e.target.value)} />
              </div>
              <div className="flex justify-end">
                <Button 
                  className="bg-black text-white px-6 py-2 rounded-lg text-base" 
                  onClick={handleAddText}
                  disabled={addDocLoading || !textName || !textContent}
                >
                  {addDocLoading ? 'Creating...' : 'Create Text'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Input
          type="search"
          placeholder="Search Knowledge Base..."
          className="w-[820px] bg-white border"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-2 px-3 py-2 text-sm font-medium rounded-md flex items-center gap-1">+ Type</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40 border-2 border-black rounded-xl mt-2">
            <DropdownMenuCheckboxItem
              checked={typeFilter.file}
              onCheckedChange={v => setTypeFilter(f => ({ ...f, file: v === true }))}
              className="flex items-center gap-2 px-3 py-2 text-base"
            >
              <FileText className="w-5 h-5 mr-2" /> File
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={typeFilter.url}
              onCheckedChange={v => setTypeFilter(f => ({ ...f, url: v === true }))}
              className="flex items-center gap-2 px-3 py-2 text-base"
            >
              <Globe className="w-5 h-5 mr-2" /> URL
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={typeFilter.text}
              onCheckedChange={v => setTypeFilter(f => ({ ...f, text: v === true }))}
              className="flex items-center gap-2 px-3 py-2 text-base"
            >
              <FileText className="w-5 h-5 mr-2" /> Text
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {selectedTypes.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-black text-white rounded-full px-3 py-1 flex items-center gap-1 text-base font-medium">
            <button
              className="mr-1 text-lg focus:outline-none"
              onClick={() => setTypeFilter({ file: false, url: false, text: false })}
              aria-label="Clear all type filters"
            >
              ×
            </button>
            Type
          </span>
          {selectedTypes.map(type => {
            const Icon = typeIcons[type as keyof typeof typeIcons];
            return (
              <span key={type} className="bg-black text-white rounded-full px-3 py-1 flex items-center gap-1 text-base font-medium">
                {Icon && <Icon className="w-4 h-4 mr-1" />}
                {typeLabels[type as keyof typeof typeLabels]}
                <button
                  className="ml-1 text-lg focus:outline-none"
                  onClick={() => setTypeFilter(f => ({ ...f, [type]: false }))}
                  aria-label={`Remove ${typeLabels[type as keyof typeof typeLabels]} filter`}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
      <div className="overflow-x-auto bg-white rounded-xl border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left font-medium px-6 py-3">Knowledge Base</th>
              <th className="text-left font-medium px-6 py-3">Created by</th>
              <th className="text-left font-medium px-6 py-3">Last updated <span className="inline-block align-middle">↓</span></th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {paginatedArticles.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 py-8">No knowledge base documents found.</td>
              </tr>
            ) : (
              paginatedArticles.map(article => {
                const meta =
                  (article.url ? localMeta[article.url] : undefined) ||
                  (article.name ? localMeta[article.name] : undefined) ||
                  {};
                return (
                  <tr
                    key={article.id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => openDetailsDrawer(article)}
                  >
                    <td className="flex items-center gap-3 px-6 py-4">
                      {/* Use the correct icon for each type */}
                      {(() => {
                        const Icon = typeIcons[article.type as keyof typeof typeIcons];
                        return Icon ? <Icon className="w-5 h-5 text-black" /> : null;
                      })()}
                      <div>
                        <div className="font-medium text-base flex items-center gap-2">
                          {article.name}
                          {/* Download link for files */}
                          {article.type === "file" && article.file_path && (
                            <a
                              href={`${API_BASE_URL}${article.file_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-gray-500 hover:text-black"
                              title="Download file"
                              onClick={e => e.stopPropagation()}
                            >
                              <Download className="w-4 h-4 inline" />
                            </a>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{article.size}</div>
                      </div>
                    </td>
                    <td>{meta.created_by || '-'}</td>
                    <td>{meta.updated_at ? new Date(meta.updated_at).toLocaleString() : '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="bg-gray-100 rounded-xl p-2 hover:bg-gray-200 focus:outline-none" onClick={e => e.stopPropagation()}>
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-48 mt-2 rounded-xl border shadow-lg">
                          <DropdownMenuItem
                            className="text-base px-4 py-2 cursor-pointer"
                            onClick={e => { e.stopPropagation(); handleCopyId(article.id); }}
                          >
                            Copy document ID
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-base px-4 py-2 cursor-pointer text-red-600"
                            onClick={e => { e.stopPropagation(); handleDelete(article.id); }}
                          >
                            Delete document
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {detailsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-30">
          <div className="bg-white shadow-lg w-full max-w-2xl h-full overflow-y-auto relative flex flex-col" style={{ borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }}>
            <button className="absolute top-4 right-4 text-gray-500 hover:text-black" onClick={() => setDetailsOpen(false)}>&times;</button>
            <div className="p-8 flex-1 flex flex-col">
              {detailsLoading ? (
                <div className="text-center text-gray-500 py-8">Loading...</div>
              ) : detailsError ? (
                <div className="text-center text-red-500 py-8">{detailsError}</div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    {detailsDoc?.type === 'url' ? <Globe className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
                    <span className="text-2xl font-semibold">{detailsDoc?.name || detailsDoc?.title || detailsDoc?.id}</span>
                    <span className="ml-auto text-xs text-gray-500">{detailsSize || detailsDoc?.size || '-'}</span>
                  </div>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Document ID</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{detailsDocId}</span>
                    <button onClick={() => {navigator.clipboard.writeText(detailsDocId || '');}} className="ml-1 text-xs text-blue-600 hover:underline flex items-center gap-1"><ClipboardCopy className="w-4 h-4" />Copy</button>
                  </div>
                  <div className="mb-4 flex items-center gap-4">
                    <div className="text-xs text-gray-500">Last updated</div>
                    <div className="text-xs">{detailsLastUpdated ? new Date(detailsLastUpdated).toLocaleString() : '-'}</div>
                  </div>
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-1">Dependent agents</div>
                    {detailsAgents.length === 0 ? (
                      <div className="text-xs">None</div>
                    ) : (
                      <ul className="text-xs list-disc ml-4">
                        {detailsAgents.map((a, i) => <li key={i}>{a.name || a.agent_id || JSON.stringify(a)}</li>)}
                      </ul>
                    )}
                  </div>
                  <div className="mb-2 flex-1 flex flex-col">
                    <div className="text-xs text-gray-500 mb-1">Text Content</div>
                    <div className="flex-1 min-h-0">
                      <pre className="bg-gray-100 rounded p-3 h-full max-h-[60vh] overflow-auto text-xs whitespace-pre-wrap" style={{ minHeight: 200 }}>
                        {(() => {
                          const content = detailsContent || detailsDoc?.text_content || detailsDoc?.content || '';
                          if (!content) return <span className="text-gray-400">No content available for this document.</span>;
                          try {
                            return JSON.stringify(JSON.parse(content), null, 2);
                          } catch {
                            return content;
                          }
                        })()}
                      </pre>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 