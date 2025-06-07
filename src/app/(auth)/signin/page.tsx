
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
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export default function SignInPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const result = await signInUserAction(values); 
       
      if (result.success && result.user) {
        toast({
          title: "Sign In Successful",
          description: result.message,
        });
        
        // Role-based redirection
        // Ensure your Supabase 'profiles' table has a 'role' column with these exact values
        if (result.user.role === 'super_admin') {
          router.push("/dashboard");
        } else if (result.user.role === 'client_admin') {
          router.push("/client-admin/dashboard"); 
        } else {
          // Fallback for any other roles or if role is not defined as expected
          toast({
            title: "Signed In, Role Unclear",
            description: `Logged in as ${result.user.email}, but role '${result.user.role}' has no specific redirect. Defaulting to dashboard.`,
            variant: "default", 
            duration: 6000,
          });
          router.push("/dashboard"); 
        }
      } else {
        toast({
          title: "Sign In Failed",
          description: result.message || "Invalid credentials or an unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Card className="w-full max-w-md shadow-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-center">Sign In</CardTitle>
        <CardDescription className="text-center">
          Enter your Email and password to access Voxaiomni.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter your email address" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your password" {...field} disabled={isPending} />
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
