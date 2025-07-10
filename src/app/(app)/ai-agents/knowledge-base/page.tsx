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
import { Search, PlusCircle, Edit2, Eye, Archive, BookOpen, Check, ChevronsUpDown, ListFilter } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/cn";
import { Globe, FileText, Upload, MoreHorizontal } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';

const ragStorage = {
  used: 0,
  total: 2.1,
  unit: "MB"
};

const mockArticles = [
  {
    id: "1",
    type: "text",
    name: "sana bank",
    size: "1.4 kB",
    createdBy: "CodeCafe Lab Development",
    lastUpdated: "Jul 9, 2025, 1:54 PM"
  }
];

export default function KnowledgeBasePage() {
  const { toast } = useToast();
  const [articles, setArticles] = React.useState(mockArticles);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<"all">("all");
  const [statusFilter, setStatusFilter] = React.useState<"all">("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const [openDialog, setOpenDialog] = React.useState<null | 'url' | 'files' | 'text'>(null);
  const [typeFilter, setTypeFilter] = React.useState({ file: false, url: false, text: false });

  const filteredArticles = articles.filter((article) => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const matchesSearch =
      (article.name?.toLowerCase() ?? '').includes(lowerSearchTerm);
    const matchesCategory = categoryFilter === "all" || article.type === categoryFilter;
    const matchesStatus = statusFilter === "all" || article.type === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
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

  const selectedTypes = Object.entries(typeFilter).filter(([_, v]) => v).map(([k]) => k);
  const typeLabels = { file: 'File', url: 'URL', text: 'Text' };
  const typeIcons = { file: FileText, url: Globe, text: FileText };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-1 border text-sm font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
          RAG Storage: <span className="font-bold ml-1">{ragStorage.used} B</span> / {ragStorage.total} {ragStorage.unit}
        </div>
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
                <Input placeholder="https://example.com" className="h-12 text-base" />
              </div>
              <div className="flex justify-end">
                <Button className="bg-black text-white px-6 py-2 rounded-lg text-base">Add URL</Button>
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
                <div className="border-2 border-black border-dashed rounded-xl flex flex-col items-center justify-center py-12 mb-4 bg-white">
                  <Upload className="w-10 h-10 mb-2 text-black" />
                  <div className="font-medium text-lg mb-1">Click or drag files to upload</div>
                  <div className="text-gray-500 text-sm mb-2">Up to 21 MB each.</div>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {['epub','pdf','docx','txt','html'].map(type => (
                      <span key={type} className="bg-gray-100 rounded-full px-3 py-1 text-xs font-medium text-gray-700">{type}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button className="bg-black text-white px-6 py-2 rounded-lg text-base">Add File</Button>
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
                <Input placeholder="Enter a name for your text" className="h-12 text-base" />
              </div>
              <div>
                <label className="block font-medium mb-2">Text Content</label>
                <Textarea placeholder="Enter your text content here" className="min-h-[120px] text-base" />
              </div>
              <div className="flex justify-end">
                <Button className="bg-black text-white px-6 py-2 rounded-lg text-base">Create Text</Button>
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
              <th className="text-left font-medium px-6 py-3">Name</th>
              <th className="text-left font-medium px-6 py-3">Created by</th>
              <th className="text-left font-medium px-6 py-3">Last updated <span className="inline-block align-middle">↓</span></th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {mockArticles.map(article => (
              <tr key={article.id} className="border-b hover:bg-gray-50">
                <td className="flex items-center gap-3 px-6 py-4">
                  <FileText className="w-5 h-5 text-black" />
                  <div>
                    <div className="font-medium text-base">{article.name}</div>
                    <div className="text-xs text-muted-foreground">{article.size}</div>
                  </div>
                </td>
                <td className="px-6 py-4">{article.createdBy}</td>
                <td className="px-6 py-4">{article.lastUpdated}</td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="bg-gray-100 rounded-xl p-2 hover:bg-gray-200 focus:outline-none">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 mt-2 rounded-xl border shadow-lg">
                      <DropdownMenuItem className="text-base px-4 py-2 cursor-pointer">Copy document ID</DropdownMenuItem>
                      <DropdownMenuItem className="text-base px-4 py-2 cursor-pointer text-red-600">Delete document</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 