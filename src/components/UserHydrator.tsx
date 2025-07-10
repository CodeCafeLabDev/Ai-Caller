"use client";
import React from "react";
import { useUser } from "@/lib/utils";

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
    fetch("http://localhost:5000/api/admin_users/me", { credentials: "include" })
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