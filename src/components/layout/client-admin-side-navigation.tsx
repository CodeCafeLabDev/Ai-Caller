
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Megaphone, Users, CreditCard, UserCircle, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import React, { useState } from 'react';

type ClientAdminNavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  basePath?: string; // For matching active state
};

const clientAdminNavItems: ClientAdminNavItem[] = [
  { href: '/client-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, basePath: '/client-admin/dashboard' },
  { href: '/client-admin/campaigns', label: 'My Campaigns', icon: Megaphone, basePath: '/client-admin/campaigns' },
  { href: '/client-admin/users', label: 'Manage Users', icon: Users, basePath: '/client-admin/users' },
  { href: '/client-admin/billing', label: 'Billing & Invoices', icon: CreditCard, basePath: '/client-admin/billing' },
  { href: '/client-admin/profile', label: 'My Profile', icon: UserCircle, basePath: '/client-admin/profile' },
];

export function ClientAdminSideNavigation() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Logo iconClassName="text-sidebar-primary" textClassName="text-sidebar-foreground" />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {clientAdminNavItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.basePath && pathname.startsWith(item.basePath))}
                tooltip={{ children: item.label, className: "bg-popover text-popover-foreground border-border" }}
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      {/* Minimal footer or can be removed for client panel */}
    </Sidebar>
  );
}
