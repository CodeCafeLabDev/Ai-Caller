
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Megaphone, Users, CreditCard, UserCircle, ChevronDown, ChevronRight, ClipboardList, Bot, History, Languages, Volume2, BookOpen, Import, UserPlus, BarChart2, AlertTriangle, FileText, TrendingUp, FileDown, ListFilter, PhoneCall, Award } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import React, { useState, useEffect } from 'react';
import { useUser } from '@/lib/utils';
import { PermissionWrapper } from '@/components/client-admin/permission-guard';

type ClientAdminSubNavItem = {
  href: string;
  label: string;
  icon?: React.ElementType;
  permission?: string;
};

type ClientAdminNavItem = {
  href?: string;
  label: string;
  icon: React.ElementType;
  basePath?: string;
  permission?: string;
  subItems?: ClientAdminSubNavItem[];
};

const clientAdminNavItems: ClientAdminNavItem[] = [
  { 
    href: '/client-admin/dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard, 
    basePath: '/client-admin/dashboard',
    permission: 'view:dashboard'
  },
  {
    label: 'My Campaigns',
    icon: Megaphone,
    basePath: '/client-admin/campaigns',
    permission: 'view:campaigns',
    subItems: [
      { href: '/client-admin/campaigns', label: 'Manage Campaigns', icon: Megaphone, permission: 'view:campaigns' },
      { href: '/client-admin/campaigns/active-paused', label: 'Active & Paused', icon: ListFilter, permission: 'view:campaigns_active_paused' },
      { href: '/client-admin/campaigns/monitor-live', label: 'Monitor Live Calls', icon: PhoneCall, permission: 'view:campaigns_monitor_live' },
      { href: '/client-admin/campaigns/top-performing', label: 'Top Performing', icon: Award, permission: 'view:campaigns_top_performing' },
    ]
  },
  // --- AI Agents Section Start ---
  {
    label: 'AI Agents',
    icon: Bot,
    basePath: '/client-admin/ai-agents',
    permission: 'view:agents',
    subItems: [
      { href: '/client-admin/ai-agents', label: 'Manage Agents', icon: Users, permission: 'view:agents' },
      { href: '/client-admin/ai-agents/create', label: 'Create Agent', icon: UserPlus, permission: 'view:agents_create' },
      { href: '/client-admin/ai-agents/language-settings', label: 'Language Settings', icon: Languages, permission: 'view:agents_language_settings' },
      { href: '/client-admin/ai-agents/voices', label: 'Voices', icon: Volume2, permission: 'view:agents_voices' },
      { href: '/client-admin/ai-agents/knowledge-base', label: 'Knowledge Base', icon: BookOpen, permission: 'view:agents_knowledge_base' },
      { href: '/client-admin/ai-agents/import-export', label: 'Import/Export JSON', icon: Import, permission: 'view:agents_import_export' },
    ]
  },
  // --- AI Agents Section End ---
  {
    label: 'Reports & Analytics',
    icon: BarChart2,
    basePath: '/client-admin/reports-analytics',
    permission: 'view:reports',
    subItems: [
      { href: '/client-admin/reports-analytics/call-reports', label: 'Call Reports', icon: FileText, permission: 'view:reports_call_reports' },
      { href: '/client-admin/reports-analytics/error-logs', label: 'Error & System Logs', icon: AlertTriangle, permission: 'view:reports_error_logs' },
      { href: '/client-admin/reports-analytics/failed-call-reports', label: 'Failed Call Reports', icon: FileText, permission: 'view:reports_failed_call_reports' },
      { href: '/client-admin/reports-analytics/export-data', label: 'Export Data', icon: FileDown, permission: 'view:reports_export_data' },
    ]
  },
  { 
    href: '/client-admin/users', 
    label: 'Manage Users', 
    icon: Users, 
    basePath: '/client-admin/users',
    permission: 'view:users'
  },
  { 
    href: '/client-admin/billing', 
    label: 'Billing & Invoices', 
    icon: CreditCard, 
    basePath: '/client-admin/billing',
    permission: 'view:billing'
  },
  { 
    href: '/client-admin/profile', 
    label: 'My Profile', 
    icon: UserCircle, 
    basePath: '/client-admin/profile',
    permission: 'view:profile'
  },
];

export function ClientAdminSideNavigation() {
  const pathname = usePathname();
  const { user } = useUser();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Automatically open the submenu if the current path matches a subitem's parent
    const activeParent = clientAdminNavItems.find(item => item.subItems && item.basePath && pathname.startsWith(item.basePath));
    if (activeParent) {
      setOpenSubmenus(prev => ({ ...prev, [activeParent.label]: true }));
    }
  }, [pathname]);

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // Helper function to check if user has permission
  const hasPermission = (permission?: string): boolean => {
    if (!permission) return true; // No permission required
    if (user?.role === 'client_admin') return true; // Client admin has all permissions
    if (user?.role === 'client_user') {
      return user?.permissions?.includes(permission) || false;
    }
    return false;
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Logo iconClassName="text-sidebar-primary" textClassName="text-sidebar-foreground" />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {clientAdminNavItems
            .filter(item => hasPermission(item.permission))
            .map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild={!item.subItems}
                onClick={item.subItems ? () => toggleSubmenu(item.label) : undefined}
                isActive={item.subItems
                  ? !!(item.basePath && pathname.startsWith(item.basePath))
                  : !!(item.href && (pathname === item.href || (item.basePath && pathname.startsWith(item.basePath))))}
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
                    .filter(subItem => hasPermission(subItem.permission))
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
    </Sidebar>
  );
}
