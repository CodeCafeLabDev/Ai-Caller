"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function EditClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");
  const { toast } = useToast();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<any>({});
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!clientId) {
      setError("No clientId provided in URL.");
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`http://localhost:5000/api/clients/${clientId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setForm(data.data);
          setError(null);
        } else {
          setError(data.message || "Failed to fetch client data.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Error fetching client data.");
        setLoading(false);
      });
  }, [clientId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { planName, ...formToSend } = form;
      const res = await fetch(`http://localhost:5000/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToSend),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Client updated successfully!" });
        router.push("/clients/list");
      } else {
        setError(data.message || "Failed to update client.");
        console.error("Update error:", data);
        toast({ title: "Error", description: data.message || "Failed to update client.", variant: "destructive" });
      }
    } catch (err) {
      setError("Error updating client.");
      console.error("Update error (catch):", err);
      toast({ title: "Error", description: "Error updating client.", variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (loading) return <div className="container mx-auto py-8">Loading client data...</div>;
  if (error) return <div className="container mx-auto py-8 text-red-500">{error}</div>;
  if (!form) return <div className="container mx-auto py-8">No client data found.</div>;

  return (
    <div className="container mx-auto py-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Edit Client</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Company Name</label>
          <Input name="companyName" value={form.companyName || ""} onChange={handleChange} required />
        </div>
        <div>
          <label className="block mb-1 font-medium">Company Email</label>
          <Input name="companyEmail" type="email" value={form.companyEmail || ""} onChange={handleChange} required />
        </div>
        <div>
          <label className="block mb-1 font-medium">Phone Number</label>
          <Input name="phoneNumber" value={form.phoneNumber || ""} onChange={handleChange} required />
        </div>
        <div>
          <label className="block mb-1 font-medium">Address</label>
          <Input name="address" value={form.address || ""} onChange={handleChange} />
        </div>
        <div>
          <label className="block mb-1 font-medium">Contact Person Name</label>
          <Input name="contactPersonName" value={form.contactPersonName || ""} onChange={handleChange} required />
        </div>
        <div>
          <label className="block mb-1 font-medium">Admin Password</label>
          <Input name="adminPassword" type="password" value={form.adminPassword || ""} onChange={handleChange} required autoComplete="new-password" />
        </div>
        {/* Add more fields as needed */}
        <div className="flex gap-4 mt-6">
          <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</Button>
          <Button type="button" variant="outline" onClick={() => router.push("/clients/list")}>Cancel</Button>
        </div>
      </form>
    </div>
  );
} 