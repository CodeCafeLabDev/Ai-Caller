
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, BookOpen, ListTree, Save, UploadCloud, Play, Tag, LanguagesIcon, Settings2 } from "lucide-react";
import type { AITemplateUseCase, AITemplateLanguage } from "@/app/(app)/ai-templates/page";

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
    if (!val || !val.trim()) return true; // Allow empty or whitespace only string
    try {
      // Basic check: attempt to parse if it looks like JSON
      if (val.trim().startsWith("{") && val.trim().endsWith("}")) {
        JSON.parse(val);
      }
      // For key:value pairs, we'll assume simple string for now, more complex parsing can be added
      return true;
    } catch (e) {
      return false;
    }
  }, { message: "Global variables must be valid JSON or key:value pairs per line if provided." }),
});

type CreateTemplateFormValues = z.infer<typeof createTemplateFormSchema>;

export default function CreateAiTemplatePage() {
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

  function onSubmit(data: CreateTemplateFormValues) {
    console.log("Create Template Data:", data);
    toast({
      title: "Template Action Simulated",
      description: `Template "${data.templateName}" saved/published (simulated).`,
    });
    // In a real app, you'd send this data to your backend
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
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <Bot className="mr-3 h-8 w-8 text-primary" /> Create New AI Template
        </h1>
        <p className="text-muted-foreground">
          Design and configure a new voice conversation flow for your AI caller.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Settings2 className="mr-2 h-5 w-5" />Template Information</CardTitle>
              <CardDescription>Basic details about your new AI template.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="templateName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Welcome Call - New Customers" {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Briefly describe the purpose of this template." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category/Use Case*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templateUseCases.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
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
                      <FormLabel>Default Language*</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templateLanguages.map(lang => <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}
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
                    <FormLabel className="flex items-center"><Tag className="mr-2 h-4 w-4 text-muted-foreground" />Tags (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., onboarding, high-priority, v2" {...field} />
                    </FormControl>
                    <FormDescription>Helps in searching and organizing templates.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><BookOpen className="mr-2 h-5 w-5" />Script Content*</CardTitle>
              <CardDescription>
                Define the conversation flow. Use placeholders like `{{'{name}'}}` for global variables.
                For a simple structure, you can use lines starting with `BOT:` and `USER_EXPECTS:` or `USER_ACTION:`.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="scriptContent"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder={`Example:\nBOT: Hello {{'{name}'}}, welcome to our service!\nUSER_EXPECTS: Confirmation\nBOT: Great! How can I help you today?\nUSER_ACTION: save_reply_to_variable 'initial_query'`}
                        className="min-h-[200px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><ListTree className="mr-2 h-5 w-5" />Global Variables</CardTitle>
                <CardDescription>Define key-value pairs (e.g., `customer_name: Alice`) or JSON for variables used in the script.</CardDescription>
            </CardHeader>
            <CardContent>
                 <FormField
                    control={form.control}
                    name="globalVariables"
                    render={({ field }) => (
                    <FormItem>
                        <FormControl>
                        <Textarea
                            placeholder={`Example key-value:\nname: Example Customer\ndue_date: 2024-12-31\n\nExample JSON:\n{\n  "name": "Example Customer",\n  "due_date": "2024-12-31"\n}`}
                            className="min-h-[100px] font-mono text-sm"
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle>Actions & Preview</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
                <Button type="button" variant="outline" onClick={handleSimulateScript} className="w-full sm:w-auto">
                    <Play className="mr-2 h-4 w-4" /> Simulate Script (Mock)
                </Button>
                <Button type="submit" variant="secondary" className="w-full sm:w-auto" onClick={() => form.setValue("status" as any, "Draft")}>
                    <Save className="mr-2 h-4 w-4" /> Save as Draft
                </Button>
                <Button type="submit" className="w-full sm:w-auto" onClick={() => form.setValue("status" as any, "Published")}>
                    <UploadCloud className="mr-2 h-4 w-4" /> Publish Template
                </Button>
            </CardContent>
             <CardContent className="mt-2">
                <p className="text-xs text-muted-foreground">* Required fields</p>
             </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}

    