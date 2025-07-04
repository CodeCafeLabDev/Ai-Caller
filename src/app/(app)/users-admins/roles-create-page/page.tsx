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
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

// Define the Role type
interface Role {
  id: number;
  name: string;
  description: string;
  permission_summary: string;
  status: string;
}

const adminRoleSchema = z.object({
  name: z.string().min(2, { message: "Role name must be at least 2 characters." }),
  description: z.string().optional(),
  permission_summary: z.string().optional(),
  status: z.enum(["active", "inactive"], { required_error: "Please select a status." }),
});

type AdminRoleFormValues = z.infer<typeof adminRoleSchema>;

export default function RolesCreatePage() {
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Fetch roles from backend
  const fetchRoles = async () => {
    const res = await fetch("http://localhost:5000/api/admin_roles");
    const data = await res.json();
    if (data.success) setRoles(data.data);
  };

  React.useEffect(() => {
    fetchRoles();
  }, []);

  const form = useForm<AdminRoleFormValues>({
    resolver: zodResolver(adminRoleSchema),
    defaultValues: {
      name: "",
      description: "",
      permission_summary: "",
      status: "active",
    },
  });

  async function onSubmit(data: AdminRoleFormValues) {
    setLoading(true);
    const res = await fetch("http://localhost:5000/api/admin_roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    if (res.ok) {
      form.reset();
      fetchRoles();
      toast({ title: "Role Created", description: "The admin role was created successfully." });
      setTimeout(() => {
        router.push("/users-admins");
      }, 1000);
    } else {
      alert("Failed to add role");
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-xl">
      <h1 className="text-3xl font-bold mb-4 font-headline">Create New Admin Role</h1>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            {loading ? "Creating..." : "Create Role"}
          </Button>
        </form>
      </Form>
    </div>
  );
} 