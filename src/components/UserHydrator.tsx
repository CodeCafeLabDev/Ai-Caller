"use client";
import React from "react";
import { useUser } from "@/lib/utils";
import { api } from "@/lib/apiConfig";
import { tokenStorage } from "@/lib/tokenStorage";

export { useUser } from "@/lib/utils";

export function UserHydrator({ children }: { children: React.ReactNode }) {
  const { setUser } = useUser();

  React.useEffect(() => {
    // Hydrate from localStorage if available
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        setUser(userData);
        console.log('Restored user from localStorage:', userData);
      } catch (error) {
        console.warn('Failed to parse stored user data:', error);
        localStorage.removeItem("user");
      }
    }
    
    // Check if we have a token before making API calls
    const token = tokenStorage.getToken();
    if (!token) {
      // No token, clear any cached user data
      localStorage.removeItem("user");
      setUser(null);
      return;
    }
    
    // Only try to fetch from API if backend is available and we have a token
    // Add a small delay to prevent race conditions
    const timeoutId = setTimeout(() => {
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
              type: data.data.type,
              companyName: data.data.companyName,
              bio: data.data.bio || '',
              // Prefer explicit clientId fields; do NOT fall back to the user's own id
              clientId: (data.data.clientId ?? data.data.client_id)?.toString(),
              permissions: Array.isArray(data.data.permissions) ? data.data.permissions : undefined,
            };
            setUser(userObj);
            localStorage.setItem("user", JSON.stringify(userObj));
            console.log('Updated user from API:', userObj);
          } else {
            // API returned failure, but don't clear token immediately
            // Let AuthGuard handle the authentication check
            console.warn('API returned failure, but keeping cached data for now');
          }
        })
        .catch(error => {
          console.warn('Backend server not available, using cached user data:', error.message);
          // Don't clear token or user data on network errors
          // Let AuthGuard handle the authentication check
        });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [setUser]);

  return <>{children}</>;
} 