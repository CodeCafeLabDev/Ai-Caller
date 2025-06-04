
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetFooter, SheetClose } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Bot, BookOpen, ListTree, Save, UploadCloud, Play, Tag, Settings2 } from "lucide-react";
import type { AITemplateUseCase, AITemplateLanguage, AITemplateStatus } from "@/app/(app)/ai-templates/page";

const templateUseCases: AITemplateUseCase[] = ["Lead Generation", "Reminder", "Feedback", "Support", "Sales", "Payment Collection", "Survey", "Other"];
const templateLanguages: AITemplateLanguage[] = ["English (US)", "Spanish (ES)", "French (FR)", "German (DE)", "Hindi (IN)", "Other"];

const createTemplateFormSchema = z.object({
  templateName: z.string().min(3, { message: "Template name must be at least 3 characters." }),
  description: z.string().max(250, { message: "Description must be 250 characters or less." }).optional(),
  category: z.enum(templateUseCases, { required_error: "Please select a category." }),
  defaultLanguage: z.enum(templateLanguages, { required_error: "Please select a default language." }),
  tags: z.string().optional(),
  scriptContent: z.string().min(10, { message: "Script content must be at least 10 characters." }),
  globalVariables: z.string().optional().refine(val => {
    if (!val || !val.trim()) return true; 
    try {
      if (val.trim().startsWith("{") && val.trim().endsWith("}")) {
        JSON.parse(val);
      }
      return true;
    } catch (e) {
      return false;
    }
  }, { message: "Global variables must be valid JSON or key:value pairs per line if provided." }),
});

export type CreateTemplateFormValues = z.infer<typeof createTemplateFormSchema>;

interface CreateTemplateFormProps {
  onSuccess: (data: CreateTemplateFormValues & { status: "Draft" | "Published" }) => void;
  onCancel: () => void;
}

export function CreateTemplateForm({ onSuccess, onCancel }: CreateTemplateFormProps) {
  const { toast } = useToast();
  const form = useForm<CreateTemplateFormValues>({
    resolver: zodResolver(createTemplateFormSchema),
    defaultValues: {
      templateName: "",
      description: "",
      category: undefined,
      defaultLanguage: undefined,
      tags: "",
      scriptContent: "",
      globalVariables: "",
    },
  });

  function handleFormSubmit(status: "Draft" | "Published") {
    form.handleSubmit((data) => {
      onSuccess({ ...data, status });
    })();
  }

  const handleSimulateScript = () => {
    const script = form.getValues("scriptContent");
    if (!script.trim()) {
        toast({ title: "Cannot Simulate", description: "Script content is empty.", variant: "destructive"});
        return;
    }
    toast({
      title: "Simulate Script (Mock)",
      description: "Script simulation functionality to be implemented. Content logged to console.",
    });
    console.log("Simulating script:", script);
  };

  return (
    <Form {...form}>
      <form className="flex flex-col flex-1 min-h-0"> {/* Changed h-full to flex-1 min-h-0 */}
        <ScrollArea className="flex-1 min-h-0"> 
          <div className="space-y-6 p-4 sm:p-6">
            <Card className="border-none shadow-none -m-2">
              <CardHeader className="px-2 py-0 pb-3">
                <CardTitle className="flex items-center text-lg"><Settings2 className="mr-2 h-5 w-5" />Template Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-2 py-0">
                <FormField
                  control={form.control}
                  name="templateName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Template Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Welcome Call" {...field} className="h-9 text-sm"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Briefly describe this template." {...field} className="text-sm"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Category/Use Case*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select a category" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templateUseCases.map(cat => <SelectItem key={cat} value={cat} className="text-sm">{cat}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="defaultLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Default Language*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select a language" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templateLanguages.map(lang => <SelectItem key={lang} value={lang} className="text-sm">{lang}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-xs"><Tag className="mr-1 h-3 w-3 text-muted-foreground" />Tags (comma-separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., onboarding, v2" {...field} className="h-9 text-sm"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-none shadow-none -m-2">
              <CardHeader className="px-2 py-0 pb-3">
                <CardTitle className="flex items-center text-lg"><BookOpen className="mr-2 h-5 w-5" />Script Content*</CardTitle>
                <CardDescription className="text-xs">
                  Define the conversation flow. Use `{{'{variable_name}'}}`.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2 py-0">
                <FormField
                  control={form.control}
                  name="scriptContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder={`Example:\nBOT: Hello {{'{name}'}}, welcome!\nUSER_EXPECTS: Greeting`}
                          className="min-h-[150px] font-mono text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-none -m-2">
              <CardHeader className="px-2 py-0 pb-3">
                  <CardTitle className="flex items-center text-lg"><ListTree className="mr-2 h-5 w-5" />Global Variables</CardTitle>
                  <CardDescription className="text-xs">Define key-value pairs (e.g., `name: Alice`) or JSON.</CardDescription>
              </CardHeader>
              <CardContent className="px-2 py-0">
                  <FormField
                      control={form.control}
                      name="globalVariables"
                      render={({ field }) => (
                      <FormItem>
                          <FormControl>
                          <Textarea
                              placeholder={`Example key-value:\nname: Example Customer\n\nExample JSON:\n{\n  "name": "Example Customer"\n}`}
                              className="min-h-[80px] font-mono text-xs"
                              {...field}
                          />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
              </CardContent>
            </Card>
            
            <p className="text-xs text-muted-foreground pt-2 px-2">* Required fields</p>
          </div>
        </ScrollArea>
        
        <SheetFooter className="p-4 border-t mt-auto"> 
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button type="button" variant="outline" onClick={handleSimulateScript} className="w-full sm:w-auto flex-1 sm:flex-none">
                <Play className="mr-2 h-4 w-4" /> Simulate (Mock)
            </Button>
            <div className="flex-grow sm:hidden"></div> 
            <SheetClose asChild>
                <Button type="button" variant="ghost" onClick={onCancel} className="w-full sm:w-auto">Cancel</Button>
            </SheetClose>
            <Button type="button" variant="secondary" onClick={() => handleFormSubmit("Draft")} className="w-full sm:w-auto">
                <Save className="mr-2 h-4 w-4" /> Save as Draft
            </Button>
            <Button type="button" onClick={() => handleFormSubmit("Published")} className="w-full sm:w-auto">
                <UploadCloud className="mr-2 h-4 w-4" /> Publish Template
            </Button>
          </div>
        </SheetFooter>
      </form>
    </Form>
  );
}
