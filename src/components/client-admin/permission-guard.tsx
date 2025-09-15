"use client";

import { useUser } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission: string;
  fallbackPath?: string;
}

export function PermissionGuard({ 
  children, 
  requiredPermission, 
  fallbackPath = '/client-admin/dashboard' 
}: PermissionGuardProps) {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Only check permissions for client users
    if (user?.role === 'client_user') {
      const userPermissions = user.permissions || [];
      
      // Check if user has the required permission
      if (!userPermissions.includes(requiredPermission)) {
        console.log(`Access denied: User lacks permission '${requiredPermission}'`);
        router.push(fallbackPath);
      }
    }
  }, [user, requiredPermission, fallbackPath, router]);

  // Only render children if user has permission or is client admin
  if (user?.role === 'client_admin' || 
      (user?.role === 'client_user' && user?.permissions?.includes(requiredPermission))) {
    return <>{children}</>;
  }

  // Show loading or nothing while checking permissions
  return null;
}

// Hook to check if user has a specific permission
export function usePermission(permission: string): boolean {
  const { user } = useUser();
  
  if (user?.role === 'client_admin') {
    return true; // Client admin has all permissions
  }
  
  if (user?.role === 'client_user') {
    return user?.permissions?.includes(permission) || false;
  }
  
  return false;
}

// Component to conditionally render based on permission
interface PermissionWrapperProps {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
}

export function PermissionWrapper({ 
  children, 
  permission, 
  fallback = null 
}: PermissionWrapperProps) {
  const hasPermission = usePermission(permission);
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
