
"use client";

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Search, Bell, Users, CreditCard, AlertCircle, Megaphone, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const notificationItems = [
  { text: "Failed call reports", icon: AlertCircle, count: 0 },
  { text: "New client signups", icon: Users, count: 2 },
  { text: "Payment failures", icon: CreditCard, count: 0 },
  { text: "Campaign limit alerts", icon: Megaphone, count: 1 },
];

export function AppHeader() {
  const pathname = usePathname();
  const isDashboard = pathname === '/dashboard';

  const totalNotifications = notificationItems.reduce((sum, item) => sum + item.count, 0);

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

        <Button variant="ghost" size="icon" className="rounded-full shrink-0" aria-label="Quick Actions">
          <PlusCircle className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full shrink-0 relative">
              <Bell className={`h-5 w-5 ${totalNotifications > 0 ? 'animate-subtle-pulse-glow' : ''}`} />
              <span className="sr-only">Toggle notifications</span>
              {totalNotifications > 0 && (
                 <span className="absolute top-0 right-0 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                 </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notificationItems.length > 0 ? (
              notificationItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <DropdownMenuItem key={index} className="flex justify-between items-center cursor-pointer">
                    <div className="flex items-center">
                      <IconComponent className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{item.text}</span>
                    </div>
                    {item.count > 0 && (
                      <Badge variant="destructive" className="ml-auto">{item.count}</Badge>
                    )}
                  </DropdownMenuItem>
                );
              })
            ) : (
                <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* User avatar/dropdown is currently in SideNavigation footer. Can be moved here if design requires. */}
      </div>
    </header>
  );
}
