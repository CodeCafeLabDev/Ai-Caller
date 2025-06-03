
"use client";

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Search, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function AppHeader() {
  const pathname = usePathname();
  const isDashboard = pathname === '/dashboard';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-2 md:gap-4">
        <SidebarTrigger className="md:hidden shrink-0" />
        {isDashboard && (
          <h2 className="text-lg font-medium text-foreground truncate hidden md:block">
            Dashboard
          </h2>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <form className="relative ml-auto flex-1 sm:flex-initial hidden md:block max-w-xs md:max-w-sm lg:max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8 w-full bg-muted"
          />
        </form>
        <Button variant="ghost" size="icon" className="rounded-full shrink-0">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Toggle notifications</span>
        </Button>
        {/* User avatar/dropdown is currently in SideNavigation footer. Can be moved here if design requires. */}
      </div>
    </header>
  );
}
