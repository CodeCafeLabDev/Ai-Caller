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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { api } from '@/lib/apiConfig';

const adminRoleSchema = z.object({
  name: z.string().min(2, { message: "Role name must be at least 2 characters." }),
  description: z.string().optional(),
  permission_summary: z.string().optional(),
  status: z.enum(["active", "inactive"], { required_error: "Please select a status." }),
});

type AdminRoleFormValues = z.infer<typeof adminRoleSchema>;

export default function RolesEditPage() {
  const [loading, setLoading] = React.useState(false);
  const [initialData, setInitialData] = React.useState<AdminRoleFormValues | null>(null);
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const roleId = params.id;

  React.useEffect(() => {
    async function fetchRole() {
      // Ensure roleId is always a string
      const id = roleId ? String(roleId) : '';
      if (!id) return;
      const res = await api.getAdminRole(id);
      const data = await res.json();
      if (data.success && data.data) {
        setInitialData({
          name: data.data.name || "",
          description: data.data.description || "",
          permission_summary: data.data.permission_summary || data.data.permissionsSummary || "",
          status: (data.data.status || "active").toLowerCase(),
        });
      }
    }
    if (roleId) fetchRole();
  }, [roleId]);

  const form = useForm<AdminRoleFormValues>({
    resolver: zodResolver(adminRoleSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      permission_summary: "",
      status: "active",
    },
    values: initialData || undefined,
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData]);

  async function onSubmit(data: AdminRoleFormValues) {
    setLoading(true);
    const id = roleId ? String(roleId) : '';
    if (!id) return;
    const res = await api.updateAdminRole(id, data);
    setLoading(false);
    if (res.ok) {
      toast({ title: "Role Updated", description: "The admin role was updated successfully." });
      setTimeout(() => {
        router.push("/users-admins");
      }, 1000);
    } else {
      alert("Failed to update role");
    }
  }

  if (!initialData) {
    return <div className="container mx-auto py-8 max-w-xl">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-xl">
      <h1 className="text-3xl font-bold mb-4 font-headline">Edit Admin Role</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card p-6 rounded-lg shadow mb-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role Name*</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Super Admin" {...field} className="h-9 text-sm" />
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
                  <Input placeholder="e.g., Full system access and control" {...field} className="h-9 text-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="permission_summary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Permission Summary</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., All Permissions" {...field} className="h-9 text-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status*</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Update Role"}
          </Button>
        </form>
      </Form>
    </div>
  );
} 