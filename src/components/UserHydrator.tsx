"use client";
import React from "react";
import { useUser } from "@/lib/utils";
import { api } from "@/lib/apiConfig";

export function UserHydrator({ children }: { children: React.ReactNode }) {
  const { setUser } = useUser();

  React.useEffect(() => {
    // Hydrate from localStorage if available
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
    api.getCurrentUser()
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const userObj = {
            userId: data.data.id ? data.data.id.toString() : '',
            email: data.data.email,
            name: data.data.name,
            avatarUrl: data.data.avatar_url,
            role: data.data.roleName,
          };
          setUser(userObj);
          localStorage.setItem("user", JSON.stringify(userObj));
        }
      });
  }, [setUser]);

  return <>{children}</>;
} 