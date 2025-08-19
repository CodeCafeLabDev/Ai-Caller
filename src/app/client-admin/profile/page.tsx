
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
import { UserCircle } from "lucide-react";
import React from "react";
import { useUser } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/apiConfig';
import ProfilePictureUploader from "@/components/ui/ProfilePictureUploader";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, { message: "Password must be at least 6 characters."}),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"],
});

export default function ClientAdminProfilePage() {
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
    companyName: '',
  });
  const [saving, setSaving] = React.useState(false);
  const [plansLoading, setPlansLoading] = React.useState(true);
  const [assignedPlans, setAssignedPlans] = React.useState<any[]>([]);

  React.useEffect(() => {
    api.getCurrentUser()
      .then((res) => res.json())
      .then((data: any) => {
        if (data.success) {
          // Only allow client admins
          if (data.data.type !== 'client' || data.data.role !== 'client_admin') {
            router.push('/signin');
            return;
          }
          setUser({
            userId: data.data.id ? data.data.id.toString() : '',
            email: data.data.email,
            name: data.data.name,
            avatarUrl: data.data.avatar_url,
            fullName: data.data.name,
            role: data.data.role,
            type: data.data.type,
            companyName: data.data.companyName,
            clientId: data.data.id ? data.data.id.toString() : '', // <-- Add this line
          });
          setProfile({
            id: data.data.id ? data.data.id.toString() : '',
            name: data.data.name || '',
            email: data.data.email || '',
            avatar_url: data.data.avatar_url ?? '',
            bio: data.data.bio ?? '',
            companyName: data.data.companyName || '',
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

  // Fetch assigned plans for this client
  const fetchAssignedPlans = React.useCallback(async (clientId: string) => {
    try {
      setPlansLoading(true);
      const res = await api.getAssignedPlansForClient(clientId);
      const data = await res.json();
      setAssignedPlans(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setAssignedPlans([]);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const cid = (profile.id || user?.clientId || user?.userId || '').toString();
    if (cid) fetchAssignedPlans(cid);
  }, [profile.id, user?.clientId, user?.userId, fetchAssignedPlans]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePictureChange = async (fileOrUrl: string | File) => {
    if (!user) return;
    if (fileOrUrl instanceof File) {
      const formData = new FormData();
      formData.append("profile_picture", fileOrUrl);
      const res = await fetch(`/api/clients/${user.userId}/avatar`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setProfile({ ...profile, avatar_url: data.avatar_url });
        toast({ title: "Profile picture updated!" });
      } else {
        toast({ title: "Failed to update profile picture", variant: "destructive" });
      }
    } else {
      setProfile({ ...profile, avatar_url: fileOrUrl });
    }
  };

  const handleDeletePicture = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/clients/${user.userId}/avatar`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProfile({ ...profile, avatar_url: '' });
        toast({ title: 'Profile picture deleted' });
      } else {
        toast({ title: 'Error deleting profile picture', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error deleting profile picture', variant: 'destructive' });
    }
  };

  const handleSave = async (overrides = {}) => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${user.userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          ...overrides
        }),
      });
      if (res.ok) {
        toast({ title: 'Profile updated!' });
        setUser({ ...user, fullName: profile.name });
      } else {
        toast({ title: 'Error updating profile', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error updating profile', variant: 'destructive' });
    }
    setSaving(false);
  };

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onPasswordSubmit = async (data: { currentPassword: string; newPassword: string; confirmNewPassword: string }) => {
    if (!user) return;
    if (data.newPassword !== data.confirmNewPassword) {
      toast({ title: 'Password Mismatch', description: 'New passwords do not match.', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch(`/api/clients/${user.userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      if (res.ok) {
        toast({ title: 'Password Reset', description: 'Password was reset successfully.' });
        passwordForm.reset();
      } else {
        const error = await res.json();
        toast({ 
          title: 'Reset Failed', 
          description: error.message || 'Could not reset password. Please check the old password.',
          variant: 'destructive' 
        });
      }
    } catch (err) {
      toast({ title: 'Reset Failed', description: 'Could not reset password.', variant: 'destructive' });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center">
            <UserCircle className="mr-2 h-7 w-7"/> My Profile
        </h1>
        <p className="text-muted-foreground">Manage your personal account settings.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <ProfilePictureUploader
              value={profile.avatar_url}
              onChange={url => setProfile({ ...profile, avatar_url: url })}
              onDelete={handleDeletePicture}
              onUpload={async (file: File) => {
                if (!user) return;
                const formData = new FormData();
                formData.append('profile_picture', file);
                const res = await fetch(`/api/clients/${user.userId}/avatar`, {
                  method: 'POST',
                  body: formData,
                });
                const data = await res.json();
                if (data.success) {
                  setProfile({ ...profile, avatar_url: data.avatar_url });
                  toast({ title: 'Profile picture updated!' });
                  return data.avatar_url; // Let the uploader call onChange
                } else {
                  toast({ title: 'Failed to update profile picture', variant: 'destructive' });
                  return '';
                }
              }}
            />
            <div>
              <CardTitle className="text-2xl">{profile.name}</CardTitle>
              <CardDescription>{profile.email} ({profile.companyName})</CardDescription>
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
            onClick={() => handleSave()}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </CardContent>
      </Card>
      
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Plans</CardTitle>
          <CardDescription>Enable or disable your assigned plans. Only enabled, active plans count toward your monthly call limit.</CardDescription>
        </CardHeader>
        <CardContent>
          {plansLoading ? (
            <div>Loading plans...</div>
          ) : assignedPlans.length === 0 ? (
            <div className="text-sm text-muted-foreground">No plans assigned yet.</div>
          ) : (
            <div className="space-y-3">
              {assignedPlans.map((ap: any) => {
                const isEnabled = ap.isEnabled === 1 || ap.isEnabled === true;
                const isActive = ap.isActive === 1 || ap.isActive === true;
                return (
                  <div key={ap.assignmentId} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{ap.planName}</span>
                        {isEnabled && isActive ? (
                          <Badge className="bg-green-600 text-white">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">Monthly Limit: {ap.monthlyLimit || 0}</div>
                      <div className="text-xs text-muted-foreground">Start: {ap.startDate ? new Date(ap.startDate).toLocaleDateString() : 'N/A'}{ap.durationDays ? ` • Duration: ${ap.durationDays} days` : ''}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label htmlFor={`enable-${ap.assignmentId}`} className="text-xs">Enable</Label>
                      <Switch
                        id={`enable-${ap.assignmentId}`}
                        checked={!!isEnabled}
                        onCheckedChange={async (checked) => {
                          try {
                            await api.toggleAssignedPlanEnabled(String(ap.assignmentId), !!checked);
                            const cid = (profile.id || user?.clientId || user?.userId || '').toString();
                            if (cid) await fetchAssignedPlans(cid);
                            toast({ title: 'Plan updated', description: `${ap.planName} ${checked ? 'enabled' : 'disabled'}` });
                          } catch (e) {
                            toast({ title: 'Error', description: 'Failed to update plan', variant: 'destructive' });
                          }
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="text-xs text-muted-foreground">
                Aggregated monthly calls limit from enabled, active plans: {
                  assignedPlans
                    .filter((ap: any) => (ap.isEnabled === 1 || ap.isEnabled === true) && (ap.isActive === 1 || ap.isActive === true))
                    .reduce((sum: number, ap: any) => sum + (parseInt(ap.monthlyLimit, 10) || 0), 0)
                }
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
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
