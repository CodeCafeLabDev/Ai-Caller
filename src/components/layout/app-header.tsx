
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Search, Bell, Users, CreditCard, AlertCircle, Megaphone, PlusCircle, UserPlus, FilePlus, FileTextIcon, UserCircle as UserProfileIcon, LogOut, Languages } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { AddClientForm, type AddClientFormValues } from '@/components/clients/add-client-form';
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const notificationItems = [
  { text: "Failed call reports", icon: AlertCircle, count: 0 },
  { text: "New client signups", icon: Users, count: 2 },
  { text: "Payment failures", icon: CreditCard, count: 0 },
  { text: "Campaign limit alerts", icon: Megaphone, count: 1 },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const isDashboard = pathname === '/dashboard';
  const [isAddClientSheetOpen, setIsAddClientSheetOpen] = React.useState(false);

  const totalNotifications = notificationItems.reduce((sum, item) => sum + item.count, 0);

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    router.push('/signin');
  };

  const handleLanguageSelect = (language: string) => {
    console.log(`Language selected: ${language}`);
    toast({
      title: "Language Selected",
      description: `${language} selected. (Localization not yet implemented)`,
    });
  };

  const handleAddClientSuccessInHeader = (data: AddClientFormValues) => {
    setIsAddClientSheetOpen(false);
    toast({
      title: "Client Added",
      description: `Client "${data.companyName}" has been successfully submitted for creation.`,
    });
    // In a real app, you might want to refresh the client list or navigate to the new client's page.
  };

  const quickActionItems = [
    { text: "Add Client", icon: UserPlus, action: () => setIsAddClientSheetOpen(true) },
    { text: "New Plan", icon: FilePlus, action: () => {
        router.push('/plans-billing'); // Assuming this is where new plans are created or managed
    } },
    { text: "Create Template", icon: FileTextIcon, action: () => {
        router.push('/ai-templates/create');
    } },
  ];


  return (
    <>
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full shrink-0" aria-label="Quick Actions">
                <PlusCircle className="h-5 w-5" />
                <span className="sr-only">Quick Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {quickActionItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <DropdownMenuItem key={index} onClick={item.action} className="cursor-pointer">
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
                <UserProfileIcon className="h-5 w-5" />
                <span className="sr-only">User Profile Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <UserProfileIcon className="mr-2 h-4 w-4" />
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

      <Sheet open={isAddClientSheetOpen} onOpenChange={setIsAddClientSheetOpen}>
        <SheetContent className="sm:max-w-lg w-full flex flex-col" side="right">
            <SheetHeader>
                <SheetTitle>Add New Client</SheetTitle>
                <SheetDescription>
                    Fill in the details below to add a new client to the system.
                </SheetDescription>
            </SheetHeader>
            <AddClientForm 
                onSuccess={handleAddClientSuccessInHeader}
                onCancel={() => setIsAddClientSheetOpen(false)} // Pass the onCancel handler
            />
        </SheetContent>
      </Sheet>
    </>
  );
}
