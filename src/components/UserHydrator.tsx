"use client";
import React from "react";
import { useUser } from "@/lib/utils";
import { api } from "@/lib/apiConfig";
import { tokenStorage } from "@/lib/tokenStorage";

export { useUser } from "@/lib/utils";

export function UserHydrator({ children }: { children: React.ReactNode }) {
  const { setUser } = useUser();

  React.useEffect(() => {
    // Let AuthGuard handle all authentication logic
    // This component just provides the useUser hook
    console.log('[UserHydrator] Component mounted, AuthGuard will handle authentication');
  }, [setUser]);

  return <>{children}</>;
} 