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
        console.log('[AuthGuard] Starting authentication check...');
        console.log('[AuthGuard] Current localStorage contents:', {
          user: localStorage.getItem("user"),
          token: tokenStorage.getToken(),
          allKeys: Object.keys(localStorage)
        });
        
        // Check if user is already in context
        if (user) {
          console.log('[AuthGuard] User already in context:', user);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // Check if we have user data in localStorage (from previous session)
        const storedUser = localStorage.getItem("user");
        const storedToken = tokenStorage.getToken();
        console.log('[AuthGuard] Stored user data:', storedUser ? 'exists' : 'not found');
        console.log('[AuthGuard] Stored token:', storedToken ? 'exists' : 'not found');
        
        if (storedUser && storedToken) {
          try {
            const userData = JSON.parse(storedUser);
            console.log('[AuthGuard] Parsed user data:', userData);
            setUser(userData);
            setIsAuthenticated(true);
            setIsLoading(false);
            console.log('[AuthGuard] User restored from localStorage, authentication complete');
            return;
          } catch (error) {
            console.warn('[AuthGuard] Failed to parse stored user data:', error);
            localStorage.removeItem("user");
            tokenStorage.removeToken();
          }
        }

        // Try to fetch current user from API
        console.log('[AuthGuard] No cached user data, attempting API call...');
        try {
          const response = await api.getCurrentUser();
          console.log('[AuthGuard] API response status:', response.status);
          console.log('[AuthGuard] API response headers:', Object.fromEntries(response.headers.entries()));
          const data = await response.json();
          console.log('[AuthGuard] API response data:', data);
          
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
            // API returned failure - check if it's an authentication error
            if (response.status === 401 || response.status === 403) {
              // Token is invalid, clear it
              tokenStorage.removeToken();
              localStorage.removeItem("user");
              if (requireAuth) {
                sessionStorage.setItem('redirectAfterLogin', pathname);
                router.push('/signin');
                return;
              }
              setIsAuthenticated(false);
            } else {
              // Other API errors - keep user logged in with cached data
              console.warn('API error but keeping user logged in:', data);
              setIsAuthenticated(true);
            }
          }
        } catch (error) {
          console.warn('Failed to verify token:', error);
          // Network errors - keep user logged in with cached data
          // Only clear token if we're sure it's an authentication issue
          if (requireAuth) {
            // Check if we have cached user data
            const cachedUser = localStorage.getItem("user");
            if (cachedUser) {
              console.log('Network error but keeping cached user data');
              setIsAuthenticated(true);
            } else {
              // No cached data and network error - redirect to login
              sessionStorage.setItem('redirectAfterLogin', pathname);
              router.push('/signin');
              return;
            }
          } else {
            setIsAuthenticated(false);
          }
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

