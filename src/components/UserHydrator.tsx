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
    
    // Only try to fetch from API if backend is available
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
      })
      .catch(error => {
        console.warn('Backend server not available, using cached user data:', error.message);
        // Continue with cached data if available
      });
  }, [setUser]);

  return <>{children}</>;
} 