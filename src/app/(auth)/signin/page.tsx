
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
// import { signInUserAction } from '@/actions/auth'; // No longer needed for bypassed auth
import { useState, useTransition } from 'react';

const formSchema = z.object({
  user_Id: z.string().optional(), // Fields are optional as they are not processed
  password: z.string().optional(),
});

export default function SignInPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_Id: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(() => {
      // Bypass authentication and directly navigate to dashboard
      toast({
        title: "Entering Dashboard (Test Mode)",
        description: "Login credentials bypassed for testing.",
      });
      router.push("/dashboard");
    });
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-center">Sign In</CardTitle>
        <CardDescription className="text-center">
          Access your Voxaiomni account. (Test mode active)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="user_Id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., your_username" {...field} disabled={isPending} />
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
                    <Input type="password" placeholder="e.g., your_password" {...field} disabled={isPending} />
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

