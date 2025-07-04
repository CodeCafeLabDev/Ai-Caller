
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, UserCircle, LogOut, Users, CreditCard, Megaphone, Bot, BarChartBig, TerminalSquare, FlaskConical, ShieldAlert, Settings, ChevronDown, ChevronRight, UserCog, ClipboardList, ShieldCheck, UserPlus, Receipt, ListFilter, PhoneCall, Award, History, Languages, FileJson, CalendarClock, FileDown, TrendingUp, AlertTriangle, BookOpen, ArrowRightLeft, KeyRound, ListChecks, CheckSquare, FileText, Database, PhoneOff } from 'lucide-react'; // Added PhoneOff
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
import { useToast } from '@/components/ui/use-toast';
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
      { href: '/clients/list', label: 'Manage Clients', icon: ClipboardList },
      { href: '/clients/account-status', label: 'Account Status Management', icon: ShieldCheck },
      { href: '/clients/users', label: 'Client Users', icon: UserCog },
    ],
  },
  {
    label: 'Plans & Billing',
    icon: CreditCard,
    basePath: '/plans-billing',
    subItems: [
      { href: '/plans-billing', label: 'Manage Plans', icon: ClipboardList },
      { href: '/plans-billing/assign-plan', label: 'Assign Plan to Client', icon: UserPlus },
      { href: '/plans-billing/invoices', label: 'Billing & Invoices', icon: Receipt },
      { href: '/plans-billing/payment-settings', label: 'Payment Settings', icon: Settings },
    ],
  },
  {
    label: 'Campaigns',
    icon: Megaphone,
    basePath: '/campaigns',
    subItems: [
      { href: '/campaigns', label: 'Manage Campaigns', icon: ClipboardList },
      { href: '/campaigns/active-paused', label: 'Active & Paused Campaigns', icon: ListFilter },
      { href: '/campaigns/monitor-live', label: 'Monitor Live Calls', icon: PhoneCall },
      { href: '/campaigns/top-performing', label: 'Top Performing', icon: Award },
    ],
  },
  {
    label: 'AI Templates',
    icon: Bot,
    basePath: '/ai-templates',
    subItems: [
        { href: '/ai-templates', label: 'Manage Templates', icon: Bot },
        { href: '/ai-templates/create', label: 'Create Template', icon: UserPlus }, 
        { href: '/ai-templates/version-history', label: 'Version History', icon: History },
        { href: '/ai-templates/language-settings', label: 'Language Settings', icon: Languages },
        { href: '/ai-templates/import-export', label: 'Import/Export JSON', icon: FileJson },
    ]
  },
  { 
    label: 'Reports & Analytics', 
    icon: BarChartBig,
    basePath: '/reports-analytics',
    subItems: [
      { href: '/reports-analytics/call-reports', label: 'Call Reports', icon: CalendarClock },
      { href: '/reports-analytics/system-usage-trends', label: 'System Usage Trends', icon: TrendingUp },
      { href: '/reports-analytics/error-logs', label: 'Error & System Logs', icon: AlertTriangle }, // Renamed
      { href: '/reports-analytics/failed-call-reports', label: 'Failed Call Reports', icon: PhoneOff }, // New
      { href: '/reports-analytics/export-data', label: 'Export Data', icon: FileDown },
    ]
  },
  { 
    label: 'Users & Admins', 
    icon: UserCog, 
    href: '/users-admins', 
  },
  { 
    label: 'Developer Tools', 
    icon: TerminalSquare,
    basePath: '/developer-tools',
    subItems: [
      { href: '/developer-tools', label: 'API Docs', icon: BookOpen },
      { href: '/developer-tools/webhooks', label: 'Webhooks', icon: ArrowRightLeft },
      { href: '/developer-tools/api-keys', label: 'API Keys', icon: KeyRound },
      { href: '/developer-tools/integration-logs', label: 'Integration Logs', icon: ListChecks },
    ]
  },
  { 
    label: 'Test Lab', 
    icon: FlaskConical,
    basePath: '/test-lab',
    subItems: [
      { href: '/test-lab/call-flow', label: 'Call Flow Simulation', icon: Bot },
      { href: '/test-lab/voice-bot-testing', label: 'Voice Bot Testing', icon: Languages },
      { href: '/test-lab/script-validation', label: 'Script Validation', icon: CheckSquare },
    ]
  },
  { 
    label: 'Alerts & Logs', 
    icon: ShieldAlert,
    basePath: '/alerts-logs',
    subItems: [
      { href: '/alerts-logs/system-alerts', label: 'System Alerts', icon: ShieldAlert },
      { href: '/alerts-logs/audit-logs', label: 'Audit Logs', icon: FileText },
      { href: '/alerts-logs/login-history', label: 'Login History', icon: History },
      { href: '/alerts-logs/client-activity', label: 'Client Activity Feed', icon: Users },
    ]
  },
  { 
    label: 'Supabase CRUD', 
    icon: Database, 
    href: '/supabase-crud-example',
    basePath: '/supabase-crud-example',
  },
  { href: '/system-settings', label: 'System Settings', icon: Settings },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export function SideNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>(() => {
    const activeParent = initialNavItems.find(item => item.basePath && pathname.startsWith(item.basePath));
    if (activeParent) {
      return { [activeParent.label]: true };
    }
    return {};
  });

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
                asChild={!item.subItems} 
                onClick={item.subItems ? () => toggleSubmenu(item.label) : undefined}
                isActive={item.subItems ? (item.basePath ? pathname.startsWith(item.basePath) : false) : (item.href ? (pathname === item.href || (item.basePath && pathname.startsWith(item.basePath) && item.href !=='/dashboard')) : false)}
                tooltip={{ children: item.label, className: "bg-popover text-popover-foreground border-border" }}
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
              >
                {item.subItems ? (
                  <>
                    <item.icon />
                    <span>{item.label}</span>
                    {openSubmenus[item.label] ? <ChevronDown className="ml-auto h-4 w-4 shrink-0" /> : <ChevronRight className="ml-auto h-4 w-4 shrink-0" />}
                  </>
                ) : (
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
                         className="text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary/80 data-[active=true]:text-sidebar-primary-foreground"
                      >
                        <Link href={subItem.href} className="flex items-center">
                          {subItem.icon && <subItem.icon className="h-3.5 w-3.5 mr-2 shrink-0" />}
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
                <AvatarFallback>AU</AvatarFallback>
              </Avatar>
              <div className="group-data-[collapsible=icon]:hidden flex flex-col items-start">
                <span className="font-medium">Admin User</span>
                <span className="text-xs text-sidebar-foreground/70">admin@AI Caller.com</span>
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
