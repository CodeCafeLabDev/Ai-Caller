
"use client";

import * as React from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserCog, PlusCircle, MoreHorizontal, Edit2, UserX, UserCheck, ListChecks, ShieldCheck, Activity, Eye, KeyRound, LogOut, Trash2, Search, ListFilterIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Metadata } from 'next';

// export const metadata: Metadata = {
//   title: 'Admin User & Role Management - Voxaiomni',
//   description: 'Oversee administrative users, their roles, permissions, and activity logs.',
//   keywords: ['admin users', 'user roles', 'permissions management', 'admin activity', 'voxaiomni'],
// };

type AdminUserStatus = "Active" | "Suspended";
type AdminRoleStatus = "Active" | "Archived";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  roleName: string;
  lastLogin: string;
  status: AdminUserStatus;
  createdOn: string;
}

interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissionsSummary: string; 
  status: AdminRoleStatus;
}

const initialMockAdminUsers: AdminUser[] = [
  { id: "admin_1", name: "Super Admin", email: "super@voxaiomni.com", roleName: "Super Administrator", lastLogin: "2024-07-22", status: "Active", createdOn: "2023-01-01" },
  { id: "admin_2", name: "Operations Lead", email: "ops@voxaiomni.com", roleName: "Operations Manager", lastLogin: "2024-07-20", status: "Active", createdOn: "2023-02-15" },
  { id: "admin_3", name: "Support Admin", email: "support_admin@voxaiomni.com", roleName: "Support Supervisor", lastLogin: "2024-07-15", status: "Suspended", createdOn: "2023-03-10" },
  { id: "admin_4", name: "Billing Admin", email: "billing@voxaiomni.com", roleName: "Billing Specialist", lastLogin: "2024-07-21", status: "Active", createdOn: "2023-04-01" },
  { id: "admin_5", name: "Read Only User", email: "readonly@voxaiomni.com", roleName: "Read-Only Analyst", lastLogin: "2024-07-18", status: "Active", createdOn: "2023-05-20" },
];

const mockAdminRoles: AdminRole[] = [
  { id: "role_super", name: "Super Administrator", description: "Full system access and control.", permissionsSummary: "All Permissions", status: "Active" },
  { id: "role_ops", name: "Operations Manager", description: "Manages campaigns, clients, and daily operations.", permissionsSummary: "Campaigns, Clients, Reports", status: "Active" },
  { id: "role_support_sup", name: "Support Supervisor", description: "Manages support team and escalations.", permissionsSummary: "Client Support, Basic Reporting", status: "Active" },
  { id: "role_billing", name: "Billing Specialist", description: "Manages billing, invoices, and payment settings.", permissionsSummary: "Billing, Invoices", status: "Active" },
  { id: "role_readonly", name: "Read-Only Analyst", description: "View access to reports and system data.", permissionsSummary: "View Reports, View Logs", status: "Archived" },
];

const adminUserStatusVariants: Record<AdminUserStatus, string> = {
  Active: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
  Suspended: "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100",
};

const adminRoleStatusVariants: Record<AdminRoleStatus, string> = {
  Active: "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100",
  Archived: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100",
};

const uniqueRoles = ["All Roles", ...new Set(initialMockAdminUsers.map(user => user.roleName))];
const adminStatusOptions: (AdminUserStatus | "All Statuses")[] = ["All Statuses", "Active", "Suspended"];


export default function UsersAdminsPage() {
  const { toast } = useToast();
  const [adminUsers, setAdminUsers] = React.useState<AdminUser[]>(initialMockAdminUsers);
  const [adminRoles, setAdminRoles] = React.useState<AdminRole[]>(mockAdminRoles);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("All Roles");
  const [statusFilter, setStatusFilter] = React.useState<AdminUserStatus | "All Statuses">("All Statuses");
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5; 

  const handleAdminUserAction = (actionName: string, userName: string, userId?: string) => {
    if ((actionName === "Suspend User" || actionName === "Activate User") && userId) {
      setAdminUsers(prevUsers => prevUsers.map(user => 
        user.id === userId ? {...user, status: user.status === "Active" ? "Suspended" : "Active"} : user
      ));
    }
    toast({
      title: `Admin User Action: ${actionName}`,
      description: `Performed on ${userName}. (Simulated)`,
    });
  };
  
  const handleAdminRoleAction = (actionName: string, roleName: string) => {
    toast({
      title: `Admin Role Action: ${actionName}`,
      description: `Performed on role ${roleName}. (Simulated)`,
    });
  };

  const filteredAdminUsers = adminUsers.filter(user => {
    const matchesSearch = searchTerm === "" || 
                          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "All Roles" || user.roleName === roleFilter;
    const matchesStatus = statusFilter === "All Statuses" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalAdminUserPages = Math.ceil(filteredAdminUsers.length / itemsPerPage);
  const paginatedAdminUsers = filteredAdminUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-3">
        <UserCog className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Admin User & Role Management</h1>
          <p className="text-muted-foreground">Oversee administrative users, roles, and their permissions.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle>Admin Users</CardTitle>
            <CardDescription>Manage individual administrative user accounts.</CardDescription>
          </div>
          <Button onClick={() => toast({ title: "Add New Admin User (Simulated)", description: "Form/dialog to be implemented."})}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Admin User
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            <div className="relative flex-grow w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name or email..."
                className="pl-10 w-full bg-background h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[180px] h-9">
                <ListFilterIcon className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                {uniqueRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AdminUserStatus | "All Statuses")}>
              <SelectTrigger className="w-full md:w-[180px] h-9">
                <ListFilterIcon className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                {adminStatusOptions.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin Name</TableHead>
                  <TableHead>Email ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAdminUsers.length > 0 ? paginatedAdminUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.roleName}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", adminUserStatusVariants[user.status])}>{user.status}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(user.lastLogin), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{format(new Date(user.createdOn), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleAdminUserAction("View Details", user.name)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAdminUserAction("Edit User", user.name)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAdminUserAction(user.status === "Active" ? "Suspend User" : "Activate User", user.name, user.id)}>
                            {user.status === "Active" ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                            {user.status === "Active" ? "Suspend" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAdminUserAction("Reset Password", user.name)}>
                            <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAdminUserAction("Force Logout", user.name)} disabled={user.status === "Suspended"}>
                            <LogOut className="mr-2 h-4 w-4" /> Force Logout
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAdminUserAction("View Activity", user.name)}>
                            <Activity className="mr-2 h-4 w-4" /> View Activity
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleAdminUserAction("Delete User", user.name)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No admin users found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
        {filteredAdminUsers.length > itemsPerPage && (
            <CardFooter className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
                Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong>
                - <strong>{Math.min(currentPage * itemsPerPage, filteredAdminUsers.length)}</strong> of <strong>{filteredAdminUsers.length}</strong> admin users
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalAdminUserPages, p + 1))} disabled={currentPage === totalAdminUserPages || totalAdminUserPages === 0}>Next</Button>
            </div>
            </CardFooter>
        )}
      </Card>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Admin Roles</CardTitle>
            <CardDescription>Define and manage roles with specific permission sets.</CardDescription>
          </div>
           <Button onClick={() => toast({ title: "Create New Admin Role (Simulated)", description: "Role creation form/dialog to be implemented."})}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Admin Role
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions Summary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="max-w-sm truncate" title={role.description}>{role.description}</TableCell>
                  <TableCell className="max-w-xs truncate" title={role.permissionsSummary}>{role.permissionsSummary}</TableCell>
                  <TableCell>
                    <Badge className={adminRoleStatusVariants[role.status]}>{role.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Role Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleAdminRoleAction("Edit Role", role.name)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit Role
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => handleAdminRoleAction("Edit Permissions", role.name)}>
                          <ListChecks className="mr-2 h-4 w-4" /> Edit Permissions
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAdminRoleAction("Delete Role", role.name)} className="text-destructive focus:text-destructive">
                           Delete Role
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role-Based Permissions</CardTitle>
          <CardDescription>Manage granular permissions for each admin role.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Define what actions users within each role can perform across the platform. 
            This section will allow fine-grained control over access to features like client management, campaign setup, billing information, AI template editing, and system settings.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => toast({ title: "Manage Permissions (Simulated)", description: "Navigation to detailed permission matrix/editor."})}>
            <ShieldCheck className="mr-2 h-4 w-4" /> Configure Permissions Matrix
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Admin Activity Logs</CardTitle>
            <CardDescription>Track significant actions performed by administrative users.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground mb-4">
                View a detailed audit trail of all administrative actions for security and accountability.
            </p>
            <Button asChild variant="outline">
                <Link href="/alerts-logs/audit-logs">
                    <Activity className="mr-2 h-4 w-4" /> View Full Audit Logs
                </Link>
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}
