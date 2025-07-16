"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from '@/lib/apiConfig';

export default function EditUserRolePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [form, setForm] = useState({
    role_name: "",
    description: "",
    permissions_summary: "",
    status: "Active",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api.getUserRole(String(id))
      .then(res => res.json())
      .then(data => {
        if (data && data.data) setForm(data.data);
      });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleStatusChange = (value: string) => {
    setForm({ ...form, status: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.updateUserRole(String(id), form);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update role");
      router.push("/clients/users");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Edit User Role</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Role Name</label>
          <Input name="role_name" value={form.role_name} onChange={handleChange} required />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <Textarea name="description" value={form.description} onChange={handleChange} required />
        </div>
        <div>
          <label className="block font-medium mb-1">Permissions Summary</label>
          <Textarea name="permissions_summary" value={form.permissions_summary} onChange={handleChange} required />
        </div>
        <div>
          <label className="block font-medium mb-1">Status</label>
          <Select value={form.status} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <Button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Role"}
        </Button>
      </form>
    </div>
  );
} 