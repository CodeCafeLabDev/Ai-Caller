
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, UserCircle, LogOut, Users, CreditCard, Megaphone, Bot, BarChartBig, TerminalSquare, FlaskConical, ShieldAlert, Settings, ChevronDown, ChevronRight, UserCog, ClipboardList, ShieldCheck, UserPlus, Receipt, ListFilter, PhoneCall, Award, History, Languages, FileJson, CalendarClock, FileDown, TrendingUp, AlertTriangle, BookOpen, ArrowRightLeft, KeyRound, ListChecks, CheckSquare, FileText, PhoneOff } from 'lucide-react'; // Removed Database, added PhoneOff
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
import { tokenStorage } from '@/lib/tokenStorage';
import { api } from '@/lib/apiConfig';
import React, { useState } from 'react';
import { useUser } from '@/lib/utils';

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
    label: 'AI Agents',
    icon: Bot,
    basePath: '/ai-agents',
    subItems: [
        { href: '/ai-agents', label: 'Manage Agents', icon: Bot },
        { href: '/ai-agents/create', label: 'Create Agent', icon: UserPlus }, 
        { href: '/ai-agents/language-settings', label: 'Language Settings', icon: Languages },
        { href: '/ai-agents/voices', label: 'Voices', icon: Megaphone },
        { href: '/ai-agents/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
        { href: '/ai-agents/import-export', label: 'Import/Export JSON', icon: FileJson },
    ]
  },
  { 
    label: 'Reports & Analytics', 
    icon: BarChartBig,
    basePath: '/reports-analytics',
    subItems: [
      { href: '/reports-analytics/call-reports', label: 'Call Reports', icon: CalendarClock },
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
    label: 'Reseller Management', 
    icon: Users, 
    href: '/sales-persons', 
  },
  { 
    label: 'Track Referrals', 
    icon: TrendingUp, 
    href: '/track-referrals', 
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

  const handleLogout = async () => {
    try {
      // Call logout API
      await api.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    }
    
    // Clear the stored token and user data
    tokenStorage.removeToken();
    localStorage.removeItem("user");
    setUser(null);
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    router.push('/signin');
  };

  const { user, setUser } = useUser();

  const hasPerm = React.useCallback((perm: string) => {
    if (!perm) return true;
    const perms = user?.permissions;
    // If permissions are undefined (legacy users), allow; if defined but empty array, deny
    if (perms === undefined) return true;
    if (!perms || perms.length === 0) return false;
    return perms.includes('*') || perms.includes(perm) || perms.some((p) => perm.startsWith(p + ':'));
  }, [user?.permissions]);

  // Map nav items to permission keys
  const navPermission: Record<string, string> = {
    'Dashboard': 'view:dashboard',
    'Clients': 'view:clients',
    'Plans & Billing': 'view:plans',
    'Campaigns': 'view:campaigns',
    'AI Agents': 'view:agents',
    'Reports & Analytics': 'view:reports',
    'Users & Admins': 'view:users_admins',
    'Reseller Management': 'view:sales_persons',
    'Track Referrals': 'view:track_referrals',
    'Developer Tools': 'view:developer_tools',
    'Test Lab': 'view:test_lab',
    'Alerts & Logs': 'view:alerts_logs',
    'System Settings': 'view:system_settings',
    'Profile': 'view:profile',
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Logo iconClassName="text-sidebar-primary" textClassName="text-sidebar-foreground" />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {initialNavItems
            .filter((item) => hasPerm(navPermission[item.label] || ''))
            .map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild={!item.subItems} 
                onClick={item.subItems ? () => toggleSubmenu(item.label) : undefined}
                isActive={item.subItems ? (item.basePath ? pathname.startsWith(item.basePath) : false) : (item.href ? (pathname === item.href || (item.basePath && pathname.startsWith(item.basePath) && item.href !=='/dashboard')) : false) || false}
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
                  {item.subItems
                    .filter((si) => {
                      const base = navPermission[item.label] || '';
                      const sub = `${base}:${si.label.toLowerCase().replace(/\s+/g,'_')}`;
                      return hasPerm(sub);
                    })
                    .map((subItem) => (
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
            {/* Fetch and display real user data from /api/profile */}
            {(() => {
              // Use React hooks in the parent component, not here!
              // So, this code assumes you have something like:
              // const [user, setUser] = useState(null);
              // useEffect(() => {
              //   fetch('/api/profile', { credentials: 'include' })
              //     .then(res => res.json())
              //     .then(data => setUser(data.user));
              // }, []);
              // And user is available in scope.

              // For this snippet, we assume `user` is available in scope.
              // Fallbacks for avatar and initials
              const getInitials = (name: string) => {
                if (!name) return "U";
                const parts = name.split(" ");
                if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
                return (parts[0][0] + parts[1][0]).toUpperCase();
              };

              return (
                <Button variant="ghost" className="w-full justify-start p-2 h-auto text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-0">
                  <Avatar className="h-8 w-8 mr-2 group-data-[collapsible=icon]:mr-0">
                    <AvatarImage
                      src={user?.avatarUrl || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlNWU3ZWIiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjM1IiByPSIxNSIgZmlsbD0iIzljYTNhZiIvPjxwYXRoIGQ9Ik0yMCA4MCBRNTAgNjAgODAgODAiIHN0cm9rZT0iIzljYTNhZiIgc3Ryb2tlLXdpZHRoPSI4IiBmaWxsPSJub25lIi8+PC9zdmc+"}
                      alt={user?.name || "User Avatar"}
                      data-ai-hint="user avatar"
                    />
                    <AvatarFallback>
                      {getInitials(user?.name || "User")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="group-data-[collapsible=icon]:hidden flex flex-col items-start">
                    <span className="font-medium">{user?.name || "User"}</span>
                    <span className="text-xs text-sidebar-foreground/70">{user?.email || "user@email.com"}</span>
                  </div>
                </Button>
              );
            })()}
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
