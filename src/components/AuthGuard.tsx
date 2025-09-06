"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/lib/utils";
import { tokenStorage } from "@/lib/tokenStorage";
import { api } from "@/lib/apiConfig";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
  allowedTypes?: ('admin' | 'client')[];
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  allowedRoles = [], 
  allowedTypes = [] 
}: AuthGuardProps) {
  const { user, setUser } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Check if user is already in context
        if (user) {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // Check if token exists
        const token = tokenStorage.getToken();
        if (!token) {
          if (requireAuth) {
            // Store the intended destination
            sessionStorage.setItem('redirectAfterLogin', pathname);
            router.push('/signin');
            return;
          }
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Try to fetch current user from API
        try {
          const response = await api.getCurrentUser();
          const data = await response.json();
          
          if (data.success && data.data) {
            const userData = {
              userId: data.data.id ? data.data.id.toString() : '',
              email: data.data.email,
              name: data.data.name || data.data.companyName,
              fullName: data.data.name || data.data.companyName,
              role: data.data.roleName,
              type: data.data.type,
              avatarUrl: data.data.avatar_url,
              companyName: data.data.companyName,
              clientId: (data.data.clientId ?? data.data.client_id)?.toString(),
              permissions: Array.isArray(data.data.permissions) ? data.data.permissions : undefined,
            };
            
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
            setIsAuthenticated(true);
          } else {
            // Token is invalid, clear it
            tokenStorage.removeToken();
            localStorage.removeItem("user");
            if (requireAuth) {
              sessionStorage.setItem('redirectAfterLogin', pathname);
              router.push('/signin');
              return;
            }
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.warn('Failed to verify token:', error);
          // Clear invalid token
          tokenStorage.removeToken();
          localStorage.removeItem("user");
          if (requireAuth) {
            sessionStorage.setItem('redirectAfterLogin', pathname);
            router.push('/signin');
            return;
          }
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        if (requireAuth) {
          sessionStorage.setItem('redirectAfterLogin', pathname);
          router.push('/signin');
          return;
        }
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, [user, setUser, router, pathname, requireAuth]);

  // Check role and type permissions
  useEffect(() => {
    if (isAuthenticated && user && (allowedRoles.length > 0 || allowedTypes.length > 0)) {
      const hasRolePermission = allowedRoles.length === 0 || allowedRoles.includes(user.role);
      const hasTypePermission = allowedTypes.length === 0 || (user.type && allowedTypes.includes(user.type));
      
      if (!hasRolePermission || !hasTypePermission) {
        // Redirect to appropriate dashboard based on user type
        if (user.type === 'admin') {
          router.push('/dashboard');
        } else if (user.type === 'client') {
          router.push('/client-admin/dashboard');
        } else {
          router.push('/signin');
        }
        return;
      }
    }
  }, [isAuthenticated, user, allowedRoles, allowedTypes, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated, don't render children
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If authentication is not required or user is authenticated, render children
  return <>{children}</>;
}
