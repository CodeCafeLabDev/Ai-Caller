"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from 'next';
import ProfilePictureUploader from "@/components/ui/ProfilePictureUploader";
import React from "react";
import { useUser } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// export const metadata: Metadata = {
//   title: 'User Profile - AI Caller',
//   description: 'Manage your account settings, personal information, and change your password.',
//   keywords: ['user profile', 'account settings', 'change password', 'personal information', 'AI Caller'],
// };

const profileFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  bio: z.string().max(160, { message: "Bio must not be longer than 160 characters." }).optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, { message: "Password must be at least 6 characters."}),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"],
});

export default function ProfilePage() {
  const { toast } = useToast();
  const { user, setUser } = useUser();
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState({
    id: '',
    name: '',
    email: '',
    avatar_url: '',
    bio: '',
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetch("http://localhost:5000/api/admin_users/me", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data: any) => {
        if (data.success) {
          setUser({
            userId: data.data.id ? data.data.id.toString() : '',
            email: data.data.email,
            name: data.data.name, // add name
            avatarUrl: data.data.avatar_url, // add avatarUrl
            fullName: data.data.name,
            role: data.data.roleName,
          });
          console.log('Fetched profile:', data.data);
          setProfile({
            id: data.data.id ? data.data.id.toString() : '',
            name: data.data.name || '',
            email: data.data.email || '',
            avatar_url: data.data.avatar_url ?? '',
            bio: data.data.bio ?? '',
          });
          setLoading(false);
        } else {
          router.push('/signin');
        }
      })
      .catch(() => {
        router.push('/signin');
      });
  }, [router, setUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePictureChange = (url: string) => {
    setProfile({ ...profile, avatar_url: url });
  };

  const handleDeletePicture = async () => {
    if (!user) return;
    await fetch("http://localhost:5000/api/admin_users/me/profile-picture", {
      method: "DELETE",
      credentials: "include",
    });
    setProfile({ ...profile, avatar_url: "" });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const res = await fetch("http://localhost:5000/api/admin_users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: profile.name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast({ title: "Profile updated!" });
      setUser({ ...user, fullName: profile.name });
    } else {
      toast({ title: "Error updating profile", variant: "destructive" });
    }
  };

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const onPasswordSubmit = async (data: { currentPassword: string; newPassword: string; confirmNewPassword: string }) => {
    if (!user) return;
    if (data.newPassword !== data.confirmNewPassword) {
      toast({ title: 'Password Mismatch', description: 'New passwords do not match.', variant: 'destructive' });
      return;
    }
    const res = await fetch(`http://localhost:5000/api/admin_users/${user.userId}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword: data.currentPassword, password: data.newPassword }),
    });
    if (res.ok) {
      toast({ title: 'Password Reset', description: 'Password was reset successfully.' });
      passwordForm.reset();
    } else {
      toast({ title: 'Reset Failed', description: 'Could not reset password. Please check the old password.', variant: 'destructive' });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-headline">User Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and personal information.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <ProfilePictureUploader
              value={profile.avatar_url}
              onChange={handlePictureChange}
              onDelete={handleDeletePicture}
            />
            <div>
              <CardTitle className="text-2xl">{profile.name}</CardTitle>
              <CardDescription>{profile.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block font-medium mb-1">Full Name</label>
            <Input name="name" value={profile.name} onChange={handleChange} />
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1">Email</label>
            <Input name="email" value={profile.email} readOnly />
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1">Bio</label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              className="w-full border rounded p-2"
            />
          </div>
          <button
            className="bg-black text-white px-6 py-2 rounded"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </CardContent>
      </Card>
      
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password. Choose a strong one!</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Change Password</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
