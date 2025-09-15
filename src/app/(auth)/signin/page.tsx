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
import { useUser, type AuthUser } from '@/lib/utils';
import { api } from '@/lib/apiConfig';
import { tokenStorage } from '@/lib/tokenStorage';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

const formSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export default function SignInPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { setUser } = useUser();
  
  // Prevent logged-in users from accessing signin page
  useAuthRedirect();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        console.log('Attempting unified login with:', values.email);
        
        // First try admin login
        let loginRes = await api.login(values);
        let loginData = null;
        let isClientUser = false;
        
        if (loginRes.ok) {
          loginData = await loginRes.json();
          if (loginData.success) {
            console.log('Admin login successful');
          }
        } else {
          console.log('Admin login failed, trying client user login');
          // Try client user login
          loginRes = await api.clientUserLogin(values);
          if (loginRes.ok) {
            loginData = await loginRes.json();
            if (loginData.success) {
              console.log('Client user login successful');
              isClientUser = true;
            }
          }
        }
        
        if (!loginRes.ok || !loginData?.success) {
          const errorData = await loginRes.json().catch(() => ({}));
          throw new Error(errorData.message || `Server error: ${loginRes.status} ${loginRes.statusText}`);
        }

        console.log('[SignIn] Login response:', loginData);
        
        // Store token
        if (loginData.token) {
          tokenStorage.setToken(loginData.token);
          console.log('[SignIn] Token stored in localStorage');
        }
        
        // Prepare user data based on login type
        let userData: AuthUser;
        if (isClientUser) {
          // Client user data structure
          userData = {
            userId: loginData.user.id ? loginData.user.id.toString() : '',
            email: loginData.user.email,
            name: loginData.user.full_name || loginData.user.email,
            fullName: loginData.user.full_name || loginData.user.email,
            role: loginData.user.role,
            type: 'client',
            avatarUrl: loginData.user.avatar_url,
            companyName: loginData.user.companyName,
            bio: '',
            permissions: loginData.user.permissions || [],
            role_name: loginData.user.role_name,
            client_id: loginData.user.client_id,
          };
        } else {
          // Admin user data structure
          userData = {
            userId: loginData.user.id ? loginData.user.id.toString() : '',
            email: loginData.user.email,
            name: loginData.user.name || loginData.user.companyName,
            fullName: loginData.user.name || loginData.user.companyName,
            role: loginData.user.role,
            type: loginData.user.type,
            avatarUrl: loginData.user.avatar_url,
            companyName: loginData.user.companyName,
            bio: loginData.user.bio || '',
          };
        }
        
        console.log('Setting user data:', userData);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);

        toast({
          title: "Sign In Successful",
          description: `Welcome, ${userData.fullName}!`,
        });

        // Check for redirect destination first
        const redirectAfterLogin = sessionStorage.getItem('redirectAfterLogin');
        if (redirectAfterLogin) {
          sessionStorage.removeItem('redirectAfterLogin');
          router.push(redirectAfterLogin);
          return;
        }

        // Redirect based on user type
        if (isClientUser || userData.role === 'client_admin' || userData.role === 'client_user') {
          console.log('Client user, redirecting to client dashboard');
          router.push("/client-admin/dashboard");
        } else {
          console.log('Admin user, redirecting to admin dashboard');
          router.push("/dashboard");
        }
        
      } catch (error) {
        console.error('Error during login:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast({
          title: "Sign In Error",
          description: errorMessage,
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
          Enter your email and password to access your account.
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
                    <Input type="email" placeholder="m@example.com" {...field} disabled={isPending} />
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
                    <Input type="password" placeholder="••••••••" {...field} disabled={isPending} />
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
        <p className="mt-4 text-center text-xs text-muted-foreground">
          You will be redirected to the appropriate dashboard based on your account type.
        </p>
      </CardContent>
    </Card>
  );
}

