
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { UserCircle, LogOut, Bell, Search } from 'lucide-react'; // Added Search
import { Input } from '@/components/ui/input'; // Added Input
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from '@/components/logo';
import { useToast } from "@/hooks/use-toast";

// Simplified mock client data for header
const mockClientData = {
  name: "Innovate Corp", // This would be dynamic in a real app
  notificationsCount: 1,
};

export function ClientAdminHeader() {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    // In a real app, this would also clear session/token
    router.push('/signin'); // Or a client-specific sign-in page
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-2 md:gap-4">
        <SidebarTrigger className="md:hidden shrink-0" />
        <div className="hidden md:block">
          <Logo iconClassName="text-primary" textClassName="text-foreground" />
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <h2 className="text-lg font-medium text-foreground hidden sm:block">
          {mockClientData.name} Portal
        </h2>

        {/* Search Bar Added Here */}
        <form className="relative ml-auto flex-1 sm:flex-initial max-w-xs hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search within panel..."
            className="pl-8 w-full bg-muted h-9"
          />
        </form>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full shrink-0 relative">
              <Bell className={`h-5 w-5 ${mockClientData.notificationsCount > 0 ? 'animate-subtle-pulse-glow' : ''}`} />
              <span className="sr-only">Toggle notifications</span>
              {mockClientData.notificationsCount > 0 && (
                 <span className="absolute top-0 right-0 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                 </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Client Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {mockClientData.notificationsCount > 0 ? (
                 <DropdownMenuItem className="cursor-pointer">
                    <Bell className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Your new campaign 'Q4 Leads' is active.</span>
                </DropdownMenuItem>
            ) : (
                <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full shrink-0" aria-label="User Profile">
              <UserCircle className="h-5 w-5" />
              <span className="sr-only">User Profile Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/client-admin/profile" className="cursor-pointer">
                <UserCircle className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
