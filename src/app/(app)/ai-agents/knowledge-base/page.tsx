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


export default function KnowledgeBasePage() {
  const { toast } = useToast();
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
  const [clients, setClients] = React.useState<{ id: string; companyName: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = React.useState<string | undefined>(undefined);
  const [clientComboboxOpen, setClientComboboxOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
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
  const [currentUser, setCurrentUser] = useState<{ name?: string; email?: string } | null>(null);

  // ElevenLabs API helpers
  const ELEVENLABS_API = 'https://api.elevenlabs.io/v1/convai/knowledge-base';
  const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '';
  console.log('ELEVENLABS_API_KEY available:', !!ELEVENLABS_API_KEY);

  async function fetchElevenLabsKnowledgeBase() {
    const res = await fetch(ELEVENLABS_API, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      } as HeadersInit,
    });
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
    const res = await fetch(`${ELEVENLABS_API}/${id}`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      } as HeadersInit,
    });
    return await res.json();
  }

  async function updateElevenLabsDocument(id: string, updatePayload: any) {
    const res = await fetch(`${ELEVENLABS_API}/${id}`, {
      method: 'PATCH',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      } as HeadersInit,
      body: JSON.stringify(updatePayload),
    });
    return await res.json();
  }

  async function deleteElevenLabsDocument(id: string) {
    await fetch(`${ELEVENLABS_API}/${id}`, {
      method: 'DELETE',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      } as HeadersInit,
    });
  }

  // Helper to add a knowledge base item to ElevenLabs and local DB
  async function addKnowledgeBaseItem(type: 'url' | 'text' | 'file', payload: any, apiKey: string, localDbPayload: any) {
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
    const elevenData = await elevenRes.json();
    console.log('ElevenLabs response:', elevenData);

    // 2. Save to your local DB
    await api.createKnowledgeBaseItem(localDbPayload);

    return elevenData;
  }

  // Fetch articles on load
  useEffect(() => {
    fetchElevenLabsKnowledgeBase().then(setArticles);
  }, []);

  // Fetch clients on load
  useEffect(() => {
    api.getClients()
      .then(res => res.json())
      .then(data => setClients(data.data || []));
  }, []);

  // Get current user info on load
  useEffect(() => {
    // Try to get user from localStorage first
    const userFromStorage = localStorage.getItem('user');
    if (userFromStorage) {
      try {
        setCurrentUser(JSON.parse(userFromStorage));
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }
    
    // If no user in localStorage, try to get from session or API
    if (!userFromStorage) {
      // You can add API call here to get current user info
      // For now, we'll use a fallback
      setCurrentUser({ name: 'Admin User', email: 'admin@example.com' });
    }
  }, []);

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

  const filteredClients = clients.filter(client =>
    client.companyName.toLowerCase().includes(search.toLowerCase())
  );

  const selectedTypes = Object.entries(typeFilter).filter(([_, v]) => v).map(([k]) => k);
  const typeLabels = { file: 'File', url: 'URL', text: 'Text' };
  const typeIcons = { file: Upload, url: Globe, text: FileText };

  const filteredArticles = articles.filter((article) => {
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

  async function handleAddUrl() {
    setAddDocLoading(true);
    try {
      const createdBy = currentUser?.name || currentUser?.email || 'Unknown User';
      
      const localDbPayload = {
        client_id: selectedClientId || null, // <-- use selected client
        type: "url",
        name: urlInput,
        url: urlInput,
        file_path: null,
        text_content: null,
        size: null,
        created_by: createdBy,
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
      const createdBy = currentUser?.name || currentUser?.email || 'Unknown User';
      
      const localDbPayload = {
        client_id: selectedClientId || null, // <-- use selected client
        type: "text",
        name: textName,
        url: null,
        file_path: null,
        text_content: textContent,
        size: `${textContent.length} chars`,
        created_by: createdBy,
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
      const createdBy = currentUser?.name || currentUser?.email || 'Unknown User';
      
      const localDbPayload = {
        client_id: selectedClientId || null, // <-- use selected client
        type: "file",
        name: file.name,
        url: null,
        file_path: "/uploads/" + file.name, // replace with actual upload logic
        text_content: null,
        size: `${(file.size / 1024).toFixed(1)} kB`,
        created_by: createdBy,
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

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<any>(null);
  const [dependentAgents, setDependentAgents] = useState<any[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Check for dependent agents before deleting
  const handleDeleteClick = async (article: any) => {
    const documentationId = article.id || article.document_id || article.documentation_id;
    
    if (!documentationId) {
      toast({ 
        title: "Error", 
        description: "Cannot delete: Invalid document ID", 
        variant: "destructive" 
      });
      return;
    }

    try {
      // Fetch dependent agents
      const res = await fetch(`https://api.elevenlabs.io/v1/convai/knowledge-base/${documentationId}/dependent-agents`, {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        } as HeadersInit,
      });

      let agents: any[] = [];
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.agents)) {
          agents = data.agents;
        } else if (Array.isArray(data)) {
          agents = data;
        } else if (data && typeof data === 'object') {
          agents = data.agents || data.dependent_agents || data.agent_list || [];
        }
      }

      setDependentAgents(agents);
      setDocumentToDelete(article);
      setDeleteDialogOpen(true);
    } catch (error) {
      console.error('Error fetching dependent agents:', error);
      // If we can't fetch dependent agents, still show the dialog but with empty agents
      setDependentAgents([]);
      setDocumentToDelete(article);
      setDeleteDialogOpen(true);
    }
  };

  // Update delete handler to use ElevenLabs API and then local DB
  const handleDelete = async () => {
    if (!documentToDelete) return;
    
    setDeleteLoading(true);
    try {
      const id = documentToDelete.id || documentToDelete.document_id || documentToDelete.documentation_id;
      const documentName = documentToDelete.name || documentToDelete.title || 'Document';
      
      console.log(`Deleting document: ${documentName} (ID: ${id})`);
      
      // Step 1: Delete from ElevenLabs API
      console.log('Step 1: Deleting from ElevenLabs...');
      await deleteElevenLabsDocument(String(id));
      
      // Step 2: Delete from local database
      console.log('Step 2: Deleting from local database...');
      try {
        await api.deleteKnowledgeBaseItem(String(id));
      } catch (localDbError) {
        console.warn('Local DB deletion failed, but continuing:', localDbError);
        // Continue even if local DB deletion fails
      }
      
      // Step 3: Refresh data from ElevenLabs (this will update both admin and client panels)
      console.log('Step 3: Refreshing data from ElevenLabs...');
      const docs = await fetchElevenLabsKnowledgeBase();
      setArticles(docs);
      await fetchLocalMeta();
      
      const agentMessage = dependentAgents.length > 0 
        ? ` and removed from ${dependentAgents.length} dependent agent(s)` 
        : '';
      
      toast({ 
        title: "Document Deleted Successfully", 
        description: `"${documentName}" has been deleted from ElevenLabs, local database, and all panels${agentMessage}.` 
      });
      
      console.log('Document deletion completed successfully');
      
    } catch (err) {
      console.error('Error during document deletion:', err);
      toast({ 
        title: "Delete Failed", 
        description: "Failed to delete document. Please try again or check your connection.", 
        variant: "destructive" 
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      setDependentAgents([]);
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
    
    console.log('Opening details for article:', article); // Debug log
    console.log('ElevenLabs API Key available:', !!ELEVENLABS_API_KEY); // Debug log
    
    // Always fetch content and size for the selected document
    try {
      const documentationId = article.id || article.document_id || article.documentation_id;
      console.log('Fetching content for documentation ID:', documentationId);
      
      // Check if documentationId is valid
      if (!documentationId) {
        console.error('No valid documentation ID found for article:', article);
        setDetailsContent('Content not available - Invalid document ID');
        setDetailsLoading(false);
        return;
      }
      
      // Fetch content using the correct ElevenLabs API endpoint
      let content = '';
      try {
        // Try different possible endpoints for content
        let res;
        let contentEndpoint = '';
        
        // Try the standard endpoint first
        try {
          contentEndpoint = `https://api.elevenlabs.io/v1/convai/knowledge-base/${documentationId}/content`;
          res = await fetch(contentEndpoint, {
            headers: {
              'xi-api-key': ELEVENLABS_API_KEY,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            } as HeadersInit,
          });
          
          if (res.status === 404) {
            // Try alternative endpoint structure
            contentEndpoint = `https://api.elevenlabs.io/v1/knowledge-base/${documentationId}/content`;
            res = await fetch(contentEndpoint, {
              headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              } as HeadersInit,
            });
          }
          
          if (res.status === 404) {
            // Try without /content suffix
            contentEndpoint = `https://api.elevenlabs.io/v1/convai/knowledge-base/${documentationId}`;
            res = await fetch(contentEndpoint, {
              headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              } as HeadersInit,
            });
          }
        } catch (fetchError) {
          console.error('Error making API request:', fetchError);
          throw fetchError;
        }
        
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            console.log('ElevenLabs content response:', data); // Debug log
            
            // Try different ways to extract content
            if (typeof data === 'string') {
              content = data;
            } else if (data.content) {
              content = data.content;
            } else if (data.text) {
              content = data.text;
            } else if (data.data) {
              content = typeof data.data === 'string' ? data.data : JSON.stringify(data.data);
            } else {
              const allStrings = extractAllStrings(data);
              content = allStrings.join('\n\n');
            }
          } else {
            // Handle non-JSON response (like HTML content)
            const responseText = await res.text();
            console.log('HTML response received, parsing content...');
            
            // Try to extract text content from HTML
            try {
              // Create a temporary DOM element to parse HTML
              const parser = new DOMParser();
              const doc = parser.parseFromString(responseText, 'text/html');
              
              // Remove script and style elements
              const scripts = doc.querySelectorAll('script, style');
              scripts.forEach(script => script.remove());
              
              // Get text content
              const textContent = doc.body?.textContent || doc.documentElement?.textContent || '';
              
              // Clean up the text (remove extra whitespace, normalize)
              const cleanedContent = textContent
                .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
                .replace(/\n\s*\n/g, '\n') // Remove empty lines
                .trim();
              
              if (cleanedContent && cleanedContent.length > 10) {
                content = cleanedContent;
                console.log('Successfully extracted content from HTML:', cleanedContent.substring(0, 100) + '...');
              } else {
                content = 'Content not available - No readable text found in HTML response';
              }
            } catch (parseError) {
              console.error('Error parsing HTML:', parseError);
              content = 'Content not available - Failed to parse HTML response';
            }
          }
        } else {
          console.error('ElevenLabs content API error:', res.status, res.statusText, 'for endpoint:', contentEndpoint);
          const errorText = await res.text();
          console.error('Error response body:', errorText.substring(0, 200));
          
          // Provide more specific error messages
          if (res.status === 401) {
            content = 'Content not available - Authentication failed. Please check your API key.';
          } else if (res.status === 404) {
            // Check if it's a specific ElevenLabs error
            try {
              const errorData = await res.json();
              if (errorData?.detail?.status === 'knowledge_base_documentation_not_found') {
                content = `Content not available - Document ID "${documentationId}" not found in ElevenLabs knowledge base.`;
              } else {
                content = `Content not available - Document not found. Tried endpoints: ${contentEndpoint}`;
              }
            } catch {
              content = `Content not available - Document not found. Tried endpoints: ${contentEndpoint}`;
            }
          } else if (res.status === 403) {
            content = 'Content not available - Access forbidden. Please check your API permissions.';
          } else {
            content = `Content not available - API error (${res.status}: ${res.statusText})`;
          }
        }
      } catch (e) { 
        console.error('Error fetching content:', e);
        content = ''; 
      }
      setDetailsContent(content);
      // Fetch size
      let size = null;
      try {
        const res2 = await fetch(`https://api.elevenlabs.io/v1/convai/knowledge-base/${documentationId}`, {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
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
        const res = await fetch(`https://api.elevenlabs.io/v1/convai/knowledge-base/${documentationId}/dependent-agents`, {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          } as HeadersInit,
        });
        
        if (res.ok) {
          const data = await res.json();
          // Ensure agents is always an array
          if (Array.isArray(data.agents)) {
            agents = data.agents;
          } else if (Array.isArray(data)) {
            agents = data;
          } else if (data && typeof data === 'object') {
            // If it's an object, try to extract agents from it
            agents = data.agents || data.dependent_agents || data.agent_list || [];
          } else {
            agents = [];
          }
        } else {
          console.log('Dependent agents API returned:', res.status, res.statusText);
          agents = [];
        }
      } catch (e) { 
        console.error('Error fetching dependent agents:', e);
        agents = []; 
      }
      
      // Ensure agents is always an array before setting state
      setDetailsAgents(Array.isArray(agents) ? agents : []);
      setDetailsLoading(false);
    } catch (err: any) {
      setDetailsError('Failed to load details.');
      setDetailsLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
      </div>
      <div className="max-w-xl mb-6">
        <Popover open={clientComboboxOpen} onOpenChange={setClientComboboxOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {selectedClientId
                ? clients.find(client => client.id === selectedClientId)?.companyName
                : "Select client..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[550px] p-0">
            <Command>
              <CommandInput
                placeholder="Search client..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>No client found.</CommandEmpty>
                <CommandGroup>
                  {filteredClients.map(client => (
                    <CommandItem
                      key={client.id}
                      value={client.companyName}
                      onSelect={() => {
                        setSelectedClientId(client.id);
                        setClientComboboxOpen(false);
                        setSearch("");
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", selectedClientId === client.id ? "opacity-100" : "opacity-0")} />
                      {client.companyName}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex gap-4 mb-6">
        <Dialog open={openDialog === 'url'} onOpenChange={v => setOpenDialog(v ? 'url' : null)}>
          <DialogTrigger asChild>
            <Button className="flex flex-col items-center justify-center w-32 h-24 gap-2 border bg-white shadow-none hover:bg-gray-50" variant="outline" onClick={() => setOpenDialog('url')}>
              <Globe className="w-6 h-6" />
              <span className="font-medium text-sm">Add URL</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden">
            <DialogTitle className="sr-only">Add URL</DialogTitle>
            <div className="flex flex-col gap-4 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gray-100 rounded-lg p-2"><Globe className="w-6 h-6" /></div>
                <span className="text-xl font-semibold">Add URL</span>
              </div>
              <div>
                <label className="block font-medium mb-2 text-sm">URL</label>
                <Input placeholder="https://example.com" className="h-10 text-sm" value={urlInput} onChange={e => setUrlInput(e.target.value)} />
              </div>
              <div className="flex justify-end">
                <Button 
                  className="bg-black text-white px-4 py-2 rounded-lg text-sm" 
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
            <Button className="flex flex-col items-center justify-center w-32 h-24 gap-2 border bg-white shadow-none hover:bg-gray-50" variant="outline" onClick={() => setOpenDialog('files')}>
              <Upload className="w-6 h-6" />
              <span className="font-medium text-sm">Add Files</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden">
            <DialogTitle className="sr-only">Add Files</DialogTitle>
            <div className="flex flex-col gap-4 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gray-100 rounded-lg p-2"><Upload className="w-6 h-6" /></div>
                <span className="text-xl font-semibold">Add Files</span>
              </div>
              <div>
                <div
                  className="border-2 border-black border-dashed rounded-lg flex flex-col items-center justify-center py-8 mb-4 bg-white cursor-pointer"
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
                  <Upload className="w-8 h-8 mb-2 text-black" />
                  <div className="font-medium text-base mb-1">Click or drag files to upload</div>
                  <div className="text-gray-500 text-xs mb-2">Up to 21 MB each.</div>
                  {file && <div className="text-xs text-black font-semibold mb-2">{file.name}</div>}
                  <div className="flex gap-1 flex-wrap justify-center">
                    {['epub','pdf','docx','txt','html'].map(type => (
                      <span key={type} className="bg-gray-100 rounded-full px-2 py-0.5 text-xs font-medium text-gray-700">{type}</span>
                    ))}
                  </div>
                </div>
                {fileUploading ? (
                  <div className="w-full flex flex-col items-center">
                    <div className="w-3/4 bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-black h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-700">{uploadProgress}%</div>
                  </div>
                ) : (
                  <Button
                    className="bg-black text-white px-4 py-2 rounded-lg text-sm"
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
            <Button className="flex flex-col items-center justify-center w-32 h-24 gap-2 border bg-white shadow-none hover:bg-gray-50" variant="outline" onClick={() => setOpenDialog('text')}>
              <FileText className="w-6 h-6" />
              <span className="font-medium text-sm">Create Text</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden">
            <DialogTitle className="sr-only">Create Text</DialogTitle>
            <div className="flex flex-col gap-4 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gray-100 rounded-lg p-2"><FileText className="w-6 h-6" /></div>
                <span className="text-xl font-semibold">Create Text</span>
              </div>
              <div>
                <label className="block font-medium mb-2 text-sm">Text Name</label>
                <Input placeholder="Enter a name for your text" className="h-10 text-sm" value={textName} onChange={e => setTextName(e.target.value)} />
              </div>
              <div>
                <label className="block font-medium mb-2 text-sm">Text Content</label>
                <Textarea placeholder="Enter your text content here" className="min-h-[100px] text-sm" value={textContent} onChange={e => setTextContent(e.target.value)} />
              </div>
              <div className="flex justify-end">
                <Button 
                  className="bg-black text-white px-4 py-2 rounded-lg text-sm" 
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
          className="w-[800px] bg-white border text-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-2 px-3 py-2 text-sm font-medium rounded-md flex items-center gap-1">+ Type</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40 border-2 border-black rounded-lg mt-2">
            <DropdownMenuCheckboxItem
              checked={typeFilter.file}
              onCheckedChange={v => setTypeFilter(f => ({ ...f, file: v === true }))}
              className="flex items-center gap-2 px-3 py-2 text-sm"
            >
              <FileText className="w-5 h-5 mr-2" /> File
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={typeFilter.url}
              onCheckedChange={v => setTypeFilter(f => ({ ...f, url: v === true }))}
              className="flex items-center gap-2 px-3 py-2 text-sm"
            >
              <Globe className="w-5 h-5 mr-2" /> URL
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={typeFilter.text}
              onCheckedChange={v => setTypeFilter(f => ({ ...f, text: v === true }))}
              className="flex items-center gap-2 px-3 py-2 text-sm"
            >
              <FileText className="w-5 h-5 mr-2" /> Text
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {selectedTypes.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-black text-white rounded-full px-3 py-1 flex items-center gap-1 text-sm font-medium">
            <button
              className="mr-1 text-base focus:outline-none"
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
              <span key={type} className="bg-black text-white rounded-full px-3 py-1 flex items-center gap-1 text-sm font-medium">
                {Icon && <Icon className="w-4 h-4 mr-1" />}
                {typeLabels[type as keyof typeof typeLabels]}
                <button
                  className="ml-1 text-base focus:outline-none"
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
              <th className="text-left font-medium px-6 py-3 text-sm w-1/3">Knowledge Base</th>
              <th className="text-left font-medium px-6 py-3 text-sm w-1/6">Client</th>
              <th className="text-left font-medium px-6 py-3 text-sm w-1/6">Created by</th>
              <th className="text-left font-medium px-6 py-3 text-sm w-1/4">Last updated <span className="inline-block align-middle">↓</span></th>
              <th className="w-16"></th>
            </tr>
          </thead>
          <tbody>
            {paginatedArticles.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 py-8 text-sm">No knowledge base documents found.</td>
              </tr>
            ) : (
              paginatedArticles.map(article => {
                const meta =
                  (article.url ? localMeta[article.url] : undefined) ||
                  (article.name ? localMeta[article.name] : undefined) ||
                  {};
                const clientName = meta.client_id ? (clients.find(c => c.id == meta.client_id)?.companyName || meta.client_id) : '-';
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
                        return Icon ? <Icon className="w-5 h-5 text-black flex-shrink-0" /> : null;
                      })()}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-base flex items-center gap-2">
                          <span className="break-words">{article.name}</span>
                          {/* Download link for files */}
                          {article.type === "file" && article.file_path && (
                            <a
                              href={`${API_BASE_URL}${article.file_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-gray-500 hover:text-black flex-shrink-0"
                              title="Download file"
                              onClick={e => e.stopPropagation()}
                            >
                              <Download className="w-4 h-4 inline" />
                            </a>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{article.size}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm break-words">{clientName}</td>
                    <td className="px-6 py-4 text-sm break-words">{meta.created_by || '-'}</td>
                    <td className="px-6 py-4 text-sm break-words">{meta.updated_at ? new Date(meta.updated_at).toLocaleString() : '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="bg-gray-100 rounded-lg p-2 hover:bg-gray-200 focus:outline-none" onClick={e => e.stopPropagation()}>
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-48 mt-2 rounded-lg border shadow-lg">
                          <DropdownMenuItem
                            className="text-sm px-4 py-2 cursor-pointer"
                            onClick={e => { e.stopPropagation(); handleCopyId(article.id); }}
                          >
                            Copy document ID
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-sm px-4 py-2 cursor-pointer text-red-600"
                            onClick={e => { e.stopPropagation(); handleDeleteClick(article); }}
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
                    <span className="ml-auto text-xs text-gray-500">{detailsContent ? `${detailsContent.length} chars` : (detailsSize || detailsDoc?.size || '-')}</span>
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
                    {!Array.isArray(detailsAgents) || detailsAgents.length === 0 ? (
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
                          if (!content || content.trim() === '') {
                            return <span className="text-gray-400">No content available for this document.</span>;
                          }
                          // Try to parse as JSON, if it fails, display as plain text
                          try {
                            const parsed = JSON.parse(content);
                            return JSON.stringify(parsed, null, 2);
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-lg font-semibold">Delete Document</DialogTitle>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <strong>"{documentToDelete?.name}"</strong>?
            </p>
            
            {dependentAgents.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <div className="text-yellow-600 mt-0.5">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">
                      This document is connected to {dependentAgents.length} agent(s):
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {dependentAgents.map((agent, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                          <span className="font-mono text-xs">{agent.agent_id || agent.id || agent.name || `Agent ${index + 1}`}</span>
                          {agent.name && agent.name !== (agent.agent_id || agent.id) && (
                            <span className="text-gray-600">({agent.name})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-yellow-600 mt-2">
                      Deleting this document will remove it from all connected agents' knowledge bases.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {dependentAgents.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  This document is not connected to any agents.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete Document"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 