
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { signInUserAction } from '@/actions/auth'; 
import { useState, useTransition } from 'react';

const formSchema = z.object({
  apiKey: z.string().min(1, { message: "API Key is required." }),
});

export default function SignInPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      // Pass the entire values object which now contains apiKey
      const result = await signInUserAction(values); 
       
      if (result.success && result.user) {
        toast({
          title: "Sign In Successful",
          description: result.message,
        });
        // Role-based redirection can remain if the API key implies a role
        if (result.user.role === 'super_admin') {
          router.push("/dashboard");
        } else if (result.user.role === 'client_admin') {
          // This case might be less relevant if only one API key grants super_admin
          router.push("/client-admin/dashboard"); 
        } else {
          router.push("/dashboard"); // Default fallback
        }
      } else {
        toast({
          title: "Sign In Failed",
          description: result.message || "Invalid API Key or an unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Card className="w-full max-w-md shadow-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-center">Sign In with API Key</CardTitle>
        <CardDescription className="text-center">
          Enter your API key to access Voxaiomni.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your API Key" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
