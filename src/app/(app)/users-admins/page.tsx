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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserCog, PlusCircle, MoreHorizontal, Edit2, UserX, UserCheck, ListChecks, ShieldCheck, Activity } from "lucide-react";

type AdminUserStatus = "Active" | "Suspended";
type AdminRoleStatus = "Active" | "Archived";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  roleName: string;
  lastActive: string;
  status: AdminUserStatus;
}

interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissionsSummary: string; // e.g., "Full Access", "Read-only", "Campaign Management"
  status: AdminRoleStatus;
}

const mockAdminUsers: AdminUser[] = [
  { id: "admin_1", name: "Super Admin", email: "super@voxaiomni.com", roleName: "Super Administrator", lastActive: "2024-07-22", status: "Active" },
  { id: "admin_2", name: "Operations Lead", email: "ops@voxaiomni.com", roleName: "Operations Manager", lastActive: "2024-07-20", status: "Active" },
  { id: "admin_3", name: "Support Admin", email: "support_admin@voxaiomni.com", roleName: "Support Supervisor", lastActive: "2024-07-15", status: "Suspended" },
];

const mockAdminRoles: AdminRole[] = [
  { id: "role_super", name: "Super Administrator", description: "Full system access and control.", permissionsSummary: "All Permissions", status: "Active" },
  { id: "role_ops", name: "Operations Manager", description: "Manages campaigns, clients, and daily operations.", permissionsSummary: "Campaigns, Clients, Reports", status: "Active" },
  { id: "role_support_sup", name: "Support Supervisor", description: "Manages support team and escalations.", permissionsSummary: "Client Support, Basic Reporting", status: "Active" },
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

export default function UsersAdminsPage() {
  const { toast } = useToast();
  const [adminUsers, setAdminUsers] = React.useState<AdminUser[]>(mockAdminUsers);
  const [adminRoles, setAdminRoles] = React.useState<AdminRole[]>(mockAdminRoles);

  const handleAdminUserAction = (actionName: string, userName: string) => {
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
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Admin Users</CardTitle>
            <CardDescription>Manage individual administrative user accounts.</CardDescription>
          </div>
          <Button onClick={() => toast({ title: "Add New Admin User (Simulated)", description: "Form/dialog to be implemented."})}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Admin User
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.roleName}</TableCell>
                  <TableCell>
                    <Badge className={adminUserStatusVariants[user.status]}>{user.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(user.lastActive).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleAdminUserAction("Edit User", user.name)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAdminUserAction(user.status === "Active" ? "Suspend User" : "Activate User", user.name)}>
                          {user.status === "Active" ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                          {user.status === "Active" ? "Suspend" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAdminUserAction("View Activity", user.name)}>
                           <Activity className="mr-2 h-4 w-4" /> View Activity
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

