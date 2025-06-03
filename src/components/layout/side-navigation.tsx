
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, UserCircle, LogOut, Users, CreditCard, Megaphone, Bot, BarChartBig, TerminalSquare, FlaskConical, ShieldAlert, Settings, ChevronDown, ChevronRight, UserCog } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';

// Define types for navigation items
type SubNavItem = {
  href: string;
  label: string;
  icon?: React.ElementType; // Optional: Icon for sub-items
};

type NavItemType = {
  href?: string; // Undefined if it's a parent of a submenu
  basePath?: string; // For matching active state of parent
  label: string;
  icon: React.ElementType;
  subItems?: SubNavItem[];
};

const initialNavItems: NavItemType[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    label: 'Clients',
    icon: Users,
    basePath: '/clients',
    subItems: [
      { href: '/clients/list', label: 'All Clients List' },
      { href: '/clients/account-status', label: 'Account Status Management' },
      { href: '/clients/users', label: 'Client Users', icon: UserCog },
    ],
  },
  { href: '/plans-billing', label: 'Plans & Billing', icon: CreditCard },
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/ai-templates', label: 'AI Templates', icon: Bot },
  { href: '/reports-analytics', label: 'Reports & Analytics', icon: BarChartBig },
  { href: '/developer-tools', label: 'Developer Tools', icon: TerminalSquare },
  { href: '/test-lab', label: 'Test Lab', icon: FlaskConical },
  { href: '/alerts-logs', label: 'Alerts & Logs', icon: ShieldAlert },
  { href: '/system-settings', label: 'System Settings', icon: Settings },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export function SideNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    router.push('/signin');
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Logo iconClassName="text-sidebar-primary" textClassName="text-sidebar-foreground" />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {initialNavItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild={!item.subItems} // Only use asChild if it's a direct link
                onClick={item.subItems ? () => toggleSubmenu(item.label) : undefined}
                isActive={item.subItems ? (item.basePath ? pathname.startsWith(item.basePath) : false) : (item.href ? (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))) : false)}
                tooltip={{ children: item.label, className: "bg-popover text-popover-foreground border-border" }}
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
              >
                {item.subItems ? (
                  // Content for parent item that toggles submenu
                  <>
                    <item.icon />
                    <span>{item.label}</span>
                    {openSubmenus[item.label] ? <ChevronDown className="ml-auto h-4 w-4 shrink-0" /> : <ChevronRight className="ml-auto h-4 w-4 shrink-0" />}
                  </>
                ) : (
                  // Content for direct link item
                  <Link href={item.href || '#'}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                )}
              </SidebarMenuButton>
              {item.subItems && openSubmenus[item.label] && (
                <SidebarMenuSub>
                  {item.subItems.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.href}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={pathname === subItem.href}
                      >
                        <Link href={subItem.href} className="flex items-center">
                          {subItem.icon && <subItem.icon className="h-3 w-3 mr-1.5" />}
                          <span>{subItem.label}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-2 h-auto text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-0">
              <Avatar className="h-8 w-8 mr-2 group-data-[collapsible=icon]:mr-0">
                <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="user avatar" />
                <AvatarFallback>VO</AvatarFallback>
              </Avatar>
              <div className="group-data-[collapsible=icon]:hidden flex flex-col items-start">
                <span className="font-medium">User Name</span>
                <span className="text-xs text-sidebar-foreground/70">user@example.com</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-56 ml-2 mb-2">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>Billing (soon)</DropdownMenuItem>
            <DropdownMenuItem disabled>Settings (soon)</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
