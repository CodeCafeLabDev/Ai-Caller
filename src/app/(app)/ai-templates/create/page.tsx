
"use client";

import * as React from "react";
import { useRouter } from 'next/navigation';
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
import { useToast } from "@/components/ui/use-toast";
import { Settings2, BookOpen, ListTree, Tag, Play, Save, UploadCloud } from "lucide-react";
import type { AITemplateUseCase, AITemplateLanguage } from "@/app/(app)/ai-templates/page";
import type { Metadata } from 'next';

// export const metadata: Metadata = {
//   title: 'Create AI Template - AI Caller',
//   description: 'Design and configure a new voice conversation flow for your AI caller.',
//   keywords: ['create ai template', 'conversation flow designer', 'script builder', 'AI Caller'],
// };


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

type CreateTemplateFormValues = z.infer<typeof createTemplateFormSchema>;

export default function CreateAITemplatePage() {
  const { toast } = useToast();
  const router = useRouter();
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
      console.log("Create Template Data:", data, "Status:", status);
      toast({
        title: `Template ${status}`,
        description: `Template "${data.templateName}" has been ${status.toLowerCase()} (Simulated).`,
      });
      // Potentially redirect or update global state
      // For now, just a simulation
      if (status === "Published") {
        // router.push("/ai-templates");
      }
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
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold font-headline">Create New AI Template</h1>
            <p className="text-muted-foreground">
            Design and configure a new voice conversation flow for your AI caller.
            </p>
        </div>
      </div>

      <Form {...form}>
        <form className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg"><Settings2 className="mr-2 h-5 w-5" />Template Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg"><BookOpen className="mr-2 h-5 w-5" />Script Content*</CardTitle>
                <CardDescription className="text-xs">
                  Define the conversation flow. Use {"`{{variable_name}}`"} for placeholders.
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
                          placeholder={"Example:\nBOT: Hello {{name}}, welcome!\nUSER_EXPECTS: Greeting"}
                          className="min-h-[200px] font-mono text-xs"
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
                  <CardTitle className="flex items-center text-lg"><ListTree className="mr-2 h-5 w-5" />Global Variables</CardTitle>
                  <CardDescription className="text-xs">Define key-value pairs (e.g., {"`name: Example Customer`"}) or JSON object.</CardDescription>
              </CardHeader>
              <CardContent>
                  <FormField
                      control={form.control}
                      name="globalVariables"
                      render={({ field }) => (
                      <FormItem>
                          <FormControl>
                          <Textarea
                              placeholder={"Example key-value (one per line):\nname: Example Customer\npromotion_code: PROMO123\n\nExample JSON:\n{\n  \"name\": \"Example Customer\",\n  \"promotion_code\": \"PROMO123\"\n}"}
                              className="min-h-[100px] font-mono text-xs"
                              {...field}
                          />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
              </CardContent>
            </Card>
            
            <p className="text-xs text-muted-foreground pt-2">* Required fields</p>

          <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleSimulateScript} className="w-full sm:w-auto">
                <Play className="mr-2 h-4 w-4" /> Simulate (Mock)
            </Button>
            <Button type="button" variant="secondary" onClick={() => handleFormSubmit("Draft")} className="w-full sm:w-auto">
                <Save className="mr-2 h-4 w-4" /> Save as Draft
            </Button>
            <Button type="button" onClick={() => handleFormSubmit("Published")} className="w-full sm:w-auto">
                <UploadCloud className="mr-2 h-4 w-4" /> Publish Template
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
