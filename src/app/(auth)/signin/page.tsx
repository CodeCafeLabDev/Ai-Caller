
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
import { useToast } from "@/components/ui/use-toast";
import { signInUserAction } from '@/actions/auth'; 
import { useState, useTransition } from 'react';

// For this temporary bypass, the user can enter any non-empty string
// into the "Email" field (acting as a User ID) and any non-empty string for "Password".
const formSchema = z.object({
  email: z.string().min(1, { message: "Please enter any text for User ID." }),
  password: z.string().min(1, { message: "Please enter any text for Password." }),
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
          title: "Sign In Successful (Bypass Mode)",
          description: `${result.message} Logged in as ${result.user.role}.`,
        });
        
        if (result.user.role === 'client_admin') {
          router.push("/client-admin/dashboard");
        } else { // Default to super_admin or any other role
          router.push("/dashboard");
        }

      } else {
        toast({
          title: "Sign In Failed",
          description: result.message || "Invalid input.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Card className="w-full max-w-md shadow-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-center">Sign In (Test Mode)</CardTitle>
        <CardDescription className="text-center">
          Enter any non-empty User ID (in Email field) and Password. Use "clientadmin" in User ID for client panel.
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
                  <FormLabel>User ID (Enter any text)</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="e.g., admin or clientadmin" {...field} disabled={isPending} />
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
                  <FormLabel>Password (Enter any text)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter any password" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Signing In..." : "Sign In (Bypass)"}
            </Button>
          </form>
        </Form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          This is a temporary bypass mode. No actual authentication is performed.
        </p>
      </CardContent>
    </Card>
  );
}
