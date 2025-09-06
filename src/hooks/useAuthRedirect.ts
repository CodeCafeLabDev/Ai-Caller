"use client";
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/lib/utils';
import { tokenStorage } from '@/lib/tokenStorage';

export function useAuthRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();

  useEffect(() => {
    // If user is logged in and trying to access signin page or home page, redirect to appropriate dashboard
    if (user && (pathname === '/signin' || pathname === '/')) {
      if (user.type === 'admin') {
        router.replace('/dashboard');
      } else if (user.type === 'client') {
        router.replace('/client-admin/dashboard');
      }
    }
  }, [user, pathname, router]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If user is logged in and browser tries to go to signin or home page, redirect to dashboard
      if (user && (window.location.pathname === '/signin' || window.location.pathname === '/')) {
        if (user.type === 'admin') {
          router.replace('/dashboard');
        } else if (user.type === 'client') {
          router.replace('/client-admin/dashboard');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, router]);
}
