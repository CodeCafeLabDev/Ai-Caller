
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { UserCircle, LogOut, Bell, Search, PlusCircle, Megaphone, CreditCard, Users as UsersIcon, Languages } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from '@/components/logo';
import { useToast } from "@/components/ui/use-toast";

// Simplified mock client data for header
const mockClientData = {
  notificationsCount: 1,
};

const clientQuickActionItems = [
  { text: "Start New Campaign", icon: Megaphone, href: "/client-admin/campaigns" }, 
  { text: "View Billing", icon: CreditCard, href: "/client-admin/billing" },
  { text: "Manage Users", icon: UsersIcon, href: "/client-admin/users" },
];

export function ClientAdminHeader() {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    // In a real app, this would also clear session/token
    router.push('/signin'); 
  };

  const handleQuickActionClick = (href: string) => {
    router.push(href);
  };

  const handleLanguageSelect = (language: string) => {
    console.log(`Language selected: ${language}`);
    toast({
      title: "Language Selected",
      description: `${language} selected. (Localization not yet implemented)`,
    });
    // Here you would typically set locale preference, e.g., in context or cookies
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-2 md:gap-4">
        <SidebarTrigger className="md:hidden shrink-0" />
        <div className="hidden md:block">
          {/* Logo can be placed here if desired, or title removed */}
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
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
            <Button variant="ghost" size="icon" className="rounded-full shrink-0" aria-label="Quick Actions">
              <PlusCircle className="h-5 w-5" />
              <span className="sr-only">Quick Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Quick Client Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {clientQuickActionItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <DropdownMenuItem key={index} onClick={() => handleQuickActionClick(item.href)} className="cursor-pointer">
                  <IconComponent className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{item.text}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

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
            <Button variant="ghost" size="icon" className="rounded-full shrink-0" aria-label="Select Language">
              <Languages className="h-5 w-5" />
              <span className="sr-only">Select Language</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>Select Language</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleLanguageSelect('English')} className="cursor-pointer">
              English
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLanguageSelect('Hindi')} className="cursor-pointer">
              हिन्दी (Hindi)
            </DropdownMenuItem>
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
