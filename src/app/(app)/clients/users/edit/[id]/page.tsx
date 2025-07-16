"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { api } from '@/lib/apiConfig';

const statusOptions = ["Active", "Suspended", "Pending"];

export default function EditClientUserPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const userId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<any>({});
  const [userRoles, setUserRoles] = React.useState<any[]>([]);
  const [clients, setClients] = React.useState<any[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!userId) {
      setError("No user id provided in URL.");
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      api.getClientUser(userId).then(res => res.json()),
      api.getUserRoles().then(res => res.json()),
      api.getClients().then(res => res.json()),
    ]).then(([userRes, rolesRes, clientsRes]) => {
      if (userRes.success) {
        setForm(userRes.data);
        setError(null);
      } else {
        setError(userRes.message || "Failed to fetch user data.");
      }
      setUserRoles(rolesRes.data || []);
      setClients(clientsRes.data || []);
      setLoading(false);
    }).catch(() => {
      setError("Error fetching user data.");
      setLoading(false);
    });
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.updateClientUser(userId || '', form);
      const data = await res.json();
      if (data.success) {
        toast({ title: "User updated successfully!" });
        router.push("/clients/users");
      } else {
        setError(data.message || "Failed to update user.");
        toast({ title: "Error", description: data.message || "Failed to update user.", variant: "destructive" });
      }
    } catch (err) {
      setError("Error updating user.");
      toast({ title: "Error", description: "Error updating user.", variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (loading) return <div className="container mx-auto py-8">Loading user data...</div>;
  if (error) return <div className="container mx-auto py-8 text-red-500">{error}</div>;
  if (!form) return <div className="container mx-auto py-8">No user data found.</div>;

  return (
    <div className="container mx-auto py-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Edit Client User</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Assign to Client</Label>
          <Select
            value={form.client_id?.toString() || ""}
            onValueChange={val => handleSelectChange("client_id", val)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Assign to Client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map(client => (
                <SelectItem key={client.id} value={String(client.id)}>
                  {client.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Full Name</Label>
          <Input name="full_name" value={form.full_name || ""} onChange={handleChange} required />
        </div>
        <div>
          <Label>Email Address</Label>
          <Input name="email" type="email" value={form.email || ""} onChange={handleChange} required />
        </div>
        <div>
          <Label>Phone Number (Optional)</Label>
          <Input name="phone" type="tel" value={form.phone || ""} onChange={handleChange} />
        </div>
        <div>
          <Label>Role</Label>
          <Select
            value={form.role_id?.toString() || ""}
            onValueChange={val => handleSelectChange("role_id", val)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {userRoles.filter(role => role.id && role.id !== "").map(role => (
                <SelectItem key={role.id} value={String(role.id)}>
                  {role.role_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select
            value={form.status || "Active"}
            onValueChange={val => handleSelectChange("status", val)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.filter(status => status && status !== "").map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Password</Label>
          <Input
            name="password"
            type="password"
            value={form.password || "********"}
            disabled
            readOnly
          />
        </div>
        <div className="flex gap-4 mt-6">
          <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</Button>
          <Button type="button" variant="outline" onClick={() => router.push("/clients/users")}>Cancel</Button>
        </div>
      </form>
    </div>
  );
} 