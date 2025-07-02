"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { EditPlanForm } from "@/components/plans/edit-plan-form";
import type { Plan } from "../../page";
import { useToast } from "@/components/ui/use-toast";

export default function EditPlanPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params?.planId;
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!planId) return;
    setLoading(true);
    fetch(`http://localhost:5000/api/plans/${planId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPlan(data.data);
        } else {
          setError(data.message || "Failed to fetch plan");
        }
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to fetch plan");
        setLoading(false);
      });
  }, [planId]);

  const handleSave = async (updatedPlan: Plan) => {
    const cleanPlan = { ...updatedPlan };
    Object.keys(cleanPlan).forEach((key) => {
      // @ts-ignore
      if (cleanPlan[key] === undefined) delete cleanPlan[key];
    });
    const res = await fetch(`http://localhost:5000/api/plans/${planId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleanPlan),
    });
    if (res.ok) {
      toast({
        title: "Success",
        description: "Plan updated successfully",
      });
      router.push("/plans-billing");
    } else {
      toast({
        title: "Error",
        description: "Failed to update plan",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    router.push("/plans-billing");
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!plan) return <div className="p-8">Plan not found.</div>;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Plan</h1>
      <EditPlanForm plan={plan} onSuccess={handleSave} onCancel={handleCancel} />
    </div>
  );
} 