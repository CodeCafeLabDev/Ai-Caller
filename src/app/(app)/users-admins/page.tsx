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
import { useToast } from "@/components/ui/use-toast"; 
import { Checkbox } from "@/components/ui/checkbox";
 
import { UserCog, PlusCircle, MoreHorizontal, Edit2, UserX, UserCheck, ListChecks, ShieldCheck, Activity, Eye, KeyRound, LogOut, Trash2, Search, ListFilterIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useUser } from '@/lib/utils';

// Removed: import type { Metadata } from 'next';
import { api } from '@/lib/apiConfig';
import { DialogTitle } from '@/components/ui/dialog';
// Removed: export const metadata: Metadata = { ... };

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
  permissionsSummary?: string;
  permission_summary?: string;
  status: AdminRoleStatus;
}

export default function UsersAdminsPage() {
  const { toast } = useToast();
  const { user } = useUser();

  const [adminUsers, setAdminUsers] = React.useState<AdminUser[]>([]);
  const [adminRoles, setAdminRoles] = React.useState<AdminRole[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("All Roles");
  const [statusFilter, setStatusFilter] = React.useState<AdminUserStatus | "All Statuses">("All Statuses");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5;
  const router = useRouter();
  const [editPermissionsOpen, setEditPermissionsOpen] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<AdminRole | null>(null);
  const [editLoading, setEditLoading] = React.useState(false);
  const [editForm, setEditForm] = React.useState({ name: "", permission_summary: "" });
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [roleToDelete, setRoleToDelete] = React.useState<AdminRole | null>(null);
  const [editRoleOpen, setEditRoleOpen] = React.useState(false);
  const [editRoleLoading, setEditRoleLoading] = React.useState(false);
  const [editRoleForm, setEditRoleForm] = React.useState({ name: "", description: "", permission_summary: "", status: "active" });
  const [roleBeingEdited, setRoleBeingEdited] = React.useState<AdminRole | null>(null);
  const [addAdminOpen, setAddAdminOpen] = React.useState(false);
  const [addAdminLoading, setAddAdminLoading] = React.useState(false);
  const [addAdminForm, setAddAdminForm] = React.useState({ name: "", email: "", roleName: "", password: "", confirmPassword: "", status: "Active", referral_code: "" });
  const [createRoleOpen, setCreateRoleOpen] = React.useState(false);
  const [createRoleLoading, setCreateRoleLoading] = React.useState(false);
  const [createRoleForm, setCreateRoleForm] = React.useState({ name: "", description: "", permission_summary: "", status: "active" });
  const [permEditorOpen, setPermEditorOpen] = React.useState(false);
  const [permEditorRole, setPermEditorRole] = React.useState<AdminRole | null>(null);
  const [permList, setPermList] = React.useState<string[]>([]);
  const [permSelectAll, setPermSelectAll] = React.useState<boolean>(false);
  const [editPermSelectAll, setEditPermSelectAll] = React.useState<boolean>(false);
  const PERMISSION_OPTIONS = React.useMemo(() => [
    { key: 'view:dashboard', label: 'Dashboard' },
    { key: 'view:clients', label: 'Clients' },
    { key: 'view:plans', label: 'Plans & Billing' },
    { key: 'view:campaigns', label: 'Campaigns' },
    { key: 'view:agents', label: 'AI Agents' },
    { key: 'view:reports', label: 'Reports & Analytics' },
    { key: 'view:users_admins', label: 'Users & Admins' },
    { key: 'view:sales_persons', label: 'Sales Persons' },
    { key: 'view:track_referrals', label: 'Track Referrals' },
    { key: 'view:developer_tools', label: 'Developer Tools' },
    { key: 'view:test_lab', label: 'Test Lab' },
    { key: 'view:alerts_logs', label: 'Alerts & Logs' },
    { key: 'view:system_settings', label: 'System Settings' },
    { key: 'view:profile', label: 'Profile' },
  ], []);
  const [viewDetailsOpen, setViewDetailsOpen] = React.useState(false);
  const [userDetails, setUserDetails] = React.useState<AdminUser | null>(null);
  const [userDetailsLoading, setUserDetailsLoading] = React.useState(false);
  const [editUserOpen, setEditUserOpen] = React.useState(false);
  const [editUserLoading, setEditUserLoading] = React.useState(false);
  const [editUserForm, setEditUserForm] = React.useState({ id: '', name: '', email: '', roleName: '', status: 'Active', password: '', confirmPassword: '', referral_code: '' });
  const [resetPasswordOpen, setResetPasswordOpen] = React.useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = React.useState(false);
  const [resetPasswordForm, setResetPasswordForm] = React.useState({ id: '', name: '', oldPassword: '', newPassword: '', confirmPassword: '' });
  const [forceLogoutOpen, setForceLogoutOpen] = React.useState(false);
  const [userToForceLogout, setUserToForceLogout] = React.useState<AdminUser | null>(null);
  const [viewActivityOpen, setViewActivityOpen] = React.useState(false);
  const [activityLoading, setActivityLoading] = React.useState(false);
  const [activityLogs, setActivityLogs] = React.useState<{ timestamp: string, type: string }[]>([]);
  const [activityUser, setActivityUser] = React.useState<AdminUser | null>(null);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<AdminUser | null>(null);

  React.useEffect(() => {
    api.getAdminUsers()
      .then(res => res.json())
      .then(data => {
        if (data.success) setAdminUsers(data.data);
      });
  }, []);

  // Refetch admin users if the current user's name or profile picture changes
  React.useEffect(() => {
    if (!user) return;
    // If the current user is in the admin users list, refetch
    if (adminUsers.some(u => u.id === user.userId)) {
      api.getAdminUsers()
        .then(res => res.json())
        .then(data => {
          if (data.success) setAdminUsers(data.data);
        });
    }
  }, [user?.fullName, user]);

  React.useEffect(() => {
    api.getAdminRoles()
      .then(res => res.json())
      .then(data => {
        if (data.success) setAdminRoles(data.data);
      });
  }, []);

  async function openPermEditor(role: AdminRole) {
    setPermEditorRole(role);
    try {
      const res = await api.getAdminRolePermissions(role.id);
      const j = await res.json();
      setPermList(Array.isArray(j.data) ? j.data : []);
    } catch {
      setPermList([]);
    }
    setPermEditorOpen(true);
  }

  async function savePerms() {
    if (!permEditorRole) return;
    const res = await api.setAdminRolePermissions(permEditorRole.id, permList);
    if (res.ok) {
      toast({ title: 'Permissions saved', description: `Updated permissions for ${permEditorRole.name}` });
      setPermEditorOpen(false);
    } else {
      toast({ title: 'Failed to save permissions', variant: 'destructive' });
    }
  }

  const adminUserStatusVariants: Record<AdminUserStatus, string> = {
    Active: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
    Suspended: "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100",
  };

  const adminRoleStatusVariants: Record<AdminRoleStatus, string> = {
    Active: "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100",
    Archived: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100",
  };

  const uniqueRoles = ["All Roles", ...new Set(adminUsers.map(user => user.roleName))];
  const adminStatusOptions: (AdminUserStatus | "All Statuses")[] = ["All Statuses", "Active", "Suspended"];

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

  React.useEffect(() => {
    if (selectedRole) {
      setEditForm({
        name: selectedRole.name || "",
        permission_summary: selectedRole.permission_summary || selectedRole.permissionsSummary || "",
      });
    }
  }, [selectedRole]);

  React.useEffect(() => {
    if (roleBeingEdited) {
      setEditRoleForm({
        name: roleBeingEdited.name || "",
        description: roleBeingEdited.description || "",
        permission_summary: roleBeingEdited.permission_summary || roleBeingEdited.permissionsSummary || "",
        status: (roleBeingEdited.status || "active").toLowerCase(),
      });
    }
  }, [roleBeingEdited]);

  React.useEffect(() => {
    // Keep edit "Select all" checkbox in sync with chosen permissions
    try {
      const current: string[] = JSON.parse(editRoleForm.permission_summary || '[]');
      setEditPermSelectAll(current.length === PERMISSION_OPTIONS.length);
    } catch {
      setEditPermSelectAll(false);
    }
  }, [editRoleForm.permission_summary, PERMISSION_OPTIONS.length]);

  async function handleEditPermissionsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole) return;
    setEditLoading(true);
    // Send only the plain data object
    const res = await api.updateAdminRole(selectedRole.id, {
      ...selectedRole,
      name: editForm.name,
      permission_summary: editForm.permission_summary,
    });
    setEditLoading(false);
    if (res.ok) {
      const updated = await res.json();
      setAdminRoles((prev) => prev.map((r) => r.id === selectedRole.id ? { ...r, ...updated.data } : r));
      setEditPermissionsOpen(false);
      toast({ title: "Permissions Updated", description: "Role permissions updated successfully." });
    } else {
      toast({ title: "Update Failed", description: "Could not update role permissions.", variant: "destructive" });
    }
  }

  async function handleDeleteRole() {
    if (!roleToDelete) return;
    const res = await api.deleteAdminRole(roleToDelete.id);
    if (res.ok) {
      setAdminRoles((prev) => prev.filter((r) => r.id !== roleToDelete.id));
      toast({ title: "Role Deleted", description: `Role '${roleToDelete.name}' deleted successfully.` });
    } else {
      toast({ title: "Delete Failed", description: "Could not delete role.", variant: "destructive" });
    }
    setDeleteDialogOpen(false);
    setRoleToDelete(null);
  }

  async function handleEditRoleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roleBeingEdited) return;
    setEditRoleLoading(true);
    // Send only the plain data object
    const res = await api.updateAdminRole(roleBeingEdited.id, editRoleForm);
    setEditRoleLoading(false);
    if (res.ok) {
      const updated = await res.json();
      setAdminRoles((prev) => prev.map((r) => r.id === roleBeingEdited.id ? { ...r, ...updated.data } : r));
      setEditRoleOpen(false);
      toast({ title: "Role Updated", description: "The admin role was updated successfully." });
    } else {
      toast({ title: "Update Failed", description: "Could not update role.", variant: "destructive" });
    }
  }

  async function handleAddAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (addAdminForm.password !== addAdminForm.confirmPassword) {
      toast({ title: "Password Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    setAddAdminLoading(true);
    // Always send all required fields, remove confirmPassword, set lastLogin to null if not present
    const payload: any = {
      name: addAdminForm.name,
      email: addAdminForm.email,
      roleName: addAdminForm.roleName,
      password: addAdminForm.password,
      status: addAdminForm.status,
      lastLogin: null
    };
    if ((addAdminForm.roleName || '').toLowerCase().replace(/_/g, ' ') === 'sales admin') {
      payload.referral_code = addAdminForm.referral_code || '';
    }
    const res = await api.createAdminUser(payload);
    setAddAdminLoading(false);
    if (res.ok) {
      const created = await res.json();
      // Use API response, but fallback to addAdminForm values if any field is missing
      const newUser = {
        name: created.data.name || addAdminForm.name,
        email: created.data.email || addAdminForm.email,
        roleName: created.data.roleName || addAdminForm.roleName,
        status: created.data.status || addAdminForm.status || 'Active',
        lastLogin: created.data.lastLogin || null,
        createdOn: created.data.createdOn || new Date().toISOString(),
        id: created.data.id,
      };
      setAdminUsers((prev) => [newUser, ...prev]);
      setAddAdminOpen(false);
      setAddAdminForm({ name: "", email: "", roleName: "", password: "", confirmPassword: "", status: "Active", referral_code: "" });
      toast({ title: "Admin User Created", description: "The admin user was created successfully." });
    } else {
      toast({ title: "Create Failed", description: "Could not create admin user.", variant: "destructive" });
    }
  }

  async function handleCreateRoleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!createRoleForm.name) {
      toast({ title: "Invalid Role Name", description: "Role name is required.", variant: "destructive" });
      return;
    }
    setCreateRoleLoading(true);
    const res = await api.createAdminRole(createRoleForm);
    setCreateRoleLoading(false);
    if (res.ok) {
      const created = await res.json();
      setAdminRoles((prev) => [created.data, ...prev]);
      setCreateRoleOpen(false);
      setCreateRoleForm({ name: "", description: "", permission_summary: "", status: "active" });
      toast({ title: "Admin Role Created", description: "The admin role was created successfully." });
    } else {
      toast({ title: "Create Failed", description: "Could not create admin role.", variant: "destructive" });
    }
  }

  async function handleViewDetails(userId: string) {
    setUserDetailsLoading(true);
    setViewDetailsOpen(true);
    const res = await api.getAdminUser(userId);
    if (res.ok) {
      const data = await res.json();
      setUserDetails(data.data);
    } else {
      setUserDetails(null);
    }
    setUserDetailsLoading(false);
  }

  async function handleEditUserOpen(userId: string) {
    setEditUserLoading(true);
    setEditUserOpen(true);
    const res = await api.getAdminUser(userId);
    if (res.ok) {
      const data = await res.json();
      setEditUserForm({
        id: data.data.id,
        name: data.data.name || '',
        email: data.data.email || '',
        roleName: data.data.roleName || '',
        status: data.data.status || 'Active',
        password: '',
        confirmPassword: '',
        referral_code: data.data.referral_code || ''
      });
    }
    setEditUserLoading(false);
  }

  async function handleEditUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editUserForm.password && editUserForm.password !== editUserForm.confirmPassword) {
      toast({ title: 'Password Mismatch', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    setEditUserLoading(true);
    const { confirmPassword, ...rest } = editUserForm;
    // Always send all required fields
    const payload: any = {
      name: rest.name,
      email: rest.email,
      roleName: rest.roleName,
      status: rest.status,
    };
    if ((rest.roleName || '').toLowerCase().replace(/_/g, ' ') === 'sales admin') {
      payload.referral_code = rest.referral_code || '';
    }
    if (rest.password) payload.password = rest.password;
    const res = await api.updateAdminUser(editUserForm.id, payload);
    setEditUserLoading(false);
    if (res.ok) {
      const updated = await res.json();
      setAdminUsers((prev) => prev.map((u) => u.id === updated.data.id ? { ...u, ...updated.data } : u));
      setEditUserOpen(false);
      toast({ title: 'Admin User Updated', description: 'The admin user was updated successfully.' });
    } else {
      toast({ title: 'Update Failed', description: 'Could not update admin user.', variant: 'destructive' });
    }
  }

  async function handleResetPasswordOpen(userId: string) {
    setResetPasswordLoading(true);
    setResetPasswordOpen(true);
    const res = await api.getAdminUser(userId);
    if (res.ok) {
      const data = await res.json();
      setResetPasswordForm({
        id: data.data.id,
        name: data.data.name || '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
    setResetPasswordLoading(false);
  }

  async function handleResetPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      toast({ title: 'Password Mismatch', description: 'New passwords do not match.', variant: 'destructive' });
      return;
    }
    setResetPasswordLoading(true);
    // Send oldPassword and newPassword to the backend
    const res = await api.resetAdminUserPassword(resetPasswordForm.id, {
      oldPassword: resetPasswordForm.oldPassword,
      password: resetPasswordForm.newPassword,
    });
    setResetPasswordLoading(false);
    if (res.ok) {
      setResetPasswordOpen(false);
      toast({ title: 'Password Reset', description: 'Password was reset successfully.' });
    } else {
      toast({ title: 'Reset Failed', description: 'Could not reset password. Please check the old password.', variant: 'destructive' });
    }
  }

  async function handleForceLogout() {
    if (!userToForceLogout) return;
    const res = await api.forceLogoutUser(userToForceLogout.id);
    setForceLogoutOpen(false);
    setUserToForceLogout(null);
    if (res.ok) {
      toast({ title: 'User Forced Logout', description: 'The user has been logged out.' });
    } else {
      toast({ title: 'Force Logout Failed', description: 'Could not force logout the user.', variant: 'destructive' });
    }
  }

  async function handleViewActivity(user: AdminUser) {
    setActivityUser(user);
    setActivityLoading(true);
    setViewActivityOpen(true);
    const res = await api.getUserActivity(user.id);
    if (res.ok) {
      const data = await res.json();
      setActivityLogs(data.data || []);
    } else {
      setActivityLogs([]);
    }
    setActivityLoading(false);
  }

  async function handleDeleteUser() {
    if (!userToDelete) return;
    const res = await api.deleteAdminUser(userToDelete.id);
    if (res.ok) {
      setAdminUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      toast({ title: 'User Deleted', description: `User '${userToDelete.name}' deleted successfully.` });
    } else {
      toast({ title: 'Delete Failed', description: 'Could not delete user.', variant: 'destructive' });
    }
    setDeleteUserDialogOpen(false);
    setUserToDelete(null);
  }

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
          <Button onClick={() => setAddAdminOpen(true)}>
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
                {uniqueRoles.filter(role => role && role !== "").map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
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
                    <TableCell className="font-medium">{user.name || '—'}</TableCell>
                    <TableCell>{user.email || '—'}</TableCell>
                    <TableCell>{user.roleName || '—'}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", adminUserStatusVariants[user.status] || "bg-gray-200 text-gray-700")}>{
                        user.status === 'Active' ? 'Active' : user.status === 'Suspended' ? 'Suspended' : 'Suspended'
                      }</Badge>
                    </TableCell>
                    <TableCell>
                      {user.lastLogin && new Date(user.lastLogin).getTime() > 0 && user.lastLogin !== '1970-01-01T00:00:00.000Z'
                        ? format(new Date(user.lastLogin), "MMM dd, yyyy")
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{user.createdOn ? format(new Date(user.createdOn), "MMM dd, yyyy") : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetails(user.id)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditUserOpen(user.id)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => {
                            const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
                            // Update backend
                            const res = await api.updateAdminUser(user.id, { ...user, status: newStatus });
                            const backendData = res.ok ? await res.json() : null;
                            console.log('Backend response for status update:', backendData);
                            if (res.ok) {
                              // Merge all fields from previous user, only update status
                              setAdminUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
                              toast({ title: `User ${newStatus === 'Suspended' ? 'Suspended' : 'Activated'}`, description: `User status updated to ${newStatus}.` });
                            } else {
                              toast({ title: 'Update Failed', description: 'Could not update user status.', variant: 'destructive' });
                            }
                          }}>
                            {user.status === 'Active' ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                            {user.status === 'Active' ? 'Suspend' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPasswordOpen(user.id)}>
                            <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { setUserToForceLogout(user); setForceLogoutOpen(true); }}
                            disabled={user.status === 'Suspended' || !user.lastLogin}
                          >
                            <LogOut className="mr-2 h-4 w-4" /> Force Logout
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewActivity(user)}>
                            <Activity className="mr-2 h-4 w-4" /> View Activity
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setUserToDelete(user); setDeleteUserDialogOpen(true); }} className="text-destructive focus:text-destructive">
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
           <Button onClick={() => setCreateRoleOpen(true)}>
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
                  <TableCell className="font-medium">{role.name || '—'}</TableCell>
                  <TableCell>{role.description || '—'}</TableCell>
                  <TableCell>
                    {(() => {
                      const raw = role.permission_summary || role.permissionsSummary || '';
                      let full = '';
                      try {
                        const arr = JSON.parse(raw);
                        full = Array.isArray(arr) ? arr.join(', ') : String(raw);
                      } catch {
                        full = String(raw);
                      }
                      if (!full) return '—';
                      return (
                        <div className="max-w-[420px] whitespace-nowrap overflow-hidden text-ellipsis">{full}</div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", adminRoleStatusVariants[role.status] || "bg-gray-200 text-gray-700")}>{
                      role.status === 'Active' ? 'Active' : role.status === 'Archived' ? 'Archived' : 'Inactive'
                    }</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Role Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => { setRoleBeingEdited(role); setEditRoleOpen(true); }}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit Role
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => openPermEditor(role)}>
                          <ListChecks className="mr-2 h-4 w-4" /> Edit Permissions
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onClick={() => { setRoleToDelete(role); setDeleteDialogOpen(true); }}
                              className="text-destructive focus:text-destructive"
                            >
                              Delete Role
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </AlertDialog>
                        <DropdownMenuItem onClick={async () => {
                          const newStatus = role.status === 'Active' ? 'Archived' : 'Active';
                          // Update backend
                          const res = await api.updateAdminRole(role.id, { ...role, status: newStatus });
                          const backendData = res.ok ? await res.json() : null;
                          console.log('Backend response for admin role status update:', backendData);
                          if (res.ok) {
                            setAdminRoles(prev => prev.map(r => r.id === role.id ? { ...r, status: newStatus } : r));
                            toast({ title: `Role ${newStatus === 'Archived' ? 'Archived' : 'Activated'}`, description: `Role status updated to ${newStatus}.` });
                          } else {
                            toast({ title: 'Update Failed', description: 'Could not update role status.', variant: 'destructive' });
                          }
                        }}>
                          {role.status === 'Active' ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                          {role.status === 'Active' ? 'Archive' : 'Activate'}
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
            This section will allow fine-grained control over access to features like client management, campaign setup, billing information, AI agent editing, and system settings.
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

      <Sheet open={permEditorOpen} onOpenChange={setPermEditorOpen}>
        <SheetContent side="right" className="sm:max-w-sm w-full flex flex-col">
          <SheetHeader>
            <SheetTitle>Edit Role Permissions</SheetTitle>
            <SheetDescription>Assign granular permissions for this role. Use slugs like view:clients, edit:agents, view:reports:call-reports.</SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <Input value={permEditorRole?.name || ''} readOnly />
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Checkbox id="perm-editor-select-all" checked={permList.length === PERMISSION_OPTIONS.length} onCheckedChange={(v: any) => {
                  const next = !!v; setPermList(next ? PERMISSION_OPTIONS.map(p => p.key) : []);
                }} />
                <label htmlFor="perm-editor-select-all" className="text-sm">Select all</label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-auto border rounded p-2">
                {PERMISSION_OPTIONS.map(opt => {
                  const checked = permList.includes(opt.key);
                  return (
                    <label key={opt.key} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={checked} onCheckedChange={(v: any) => {
                        const isOn = !!v; const next = new Set(permList);
                        if (isOn) next.add(opt.key); else next.delete(opt.key);
                        setPermList(Array.from(next));
                      }} />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Only the selected pages will be visible to users with this role.</p>
            </div>
            <SheetFooter>
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setPermEditorOpen(false)}>Cancel</Button>
              <Button type="button" onClick={savePerms} className="w-full sm:w-auto">Save</Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={editRoleOpen} onOpenChange={setEditRoleOpen}>
        <SheetContent side="right" className="sm:max-w-sm w-full flex flex-col">
          <SheetHeader>
            <SheetTitle>Edit Admin Role</SheetTitle>
            <SheetDescription>Update all details for this admin role.</SheetDescription>
          </SheetHeader>
          <div className="py-4 overflow-y-auto max-h-[calc(100vh-120px)]">
            <form onSubmit={handleEditRoleSubmit} className="space-y-6 bg-card p-6 rounded-lg shadow">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Role Name*</label>
                <Input
                  value={editRoleForm.name}
                  onChange={e => setEditRoleForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={editRoleForm.description}
                  onChange={e => setEditRoleForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Permissions</label>
                <div className="mb-2 flex items-center gap-2">
                  <Checkbox id="edit-perm-select-all" checked={editPermSelectAll} onCheckedChange={(v: any) => {
                    const next = !!v; setEditPermSelectAll(next);
                    if (next) setEditRoleForm(f => ({ ...f, permission_summary: JSON.stringify(PERMISSION_OPTIONS.map(p => p.key)) }));
                    else setEditRoleForm(f => ({ ...f, permission_summary: JSON.stringify([]) }));
                  }} />
                  <label htmlFor="edit-perm-select-all" className="text-sm">Select all</label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-auto border rounded p-2">
                  {PERMISSION_OPTIONS.map(opt => {
                    const current: string[] = (() => { try { return JSON.parse(editRoleForm.permission_summary || '[]'); } catch { return []; } })();
                    const checked = current.includes(opt.key);
                    return (
                      <label key={opt.key} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={checked} onCheckedChange={(v: any) => {
                          const isOn = !!v; const next = new Set(current);
                          if (isOn) next.add(opt.key); else next.delete(opt.key);
                          setEditRoleForm(f => ({ ...f, permission_summary: JSON.stringify(Array.from(next)) }));
                        }} />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Adjust which pages are visible to users with this role.</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Status*</label>
                <Select value={editRoleForm.status} onValueChange={val => setEditRoleForm(f => ({ ...f, status: val }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <SheetFooter>
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setEditRoleOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editRoleLoading} className="w-full sm:w-auto">
                  {editRoleLoading ? "Updating..." : "Update Role"}
                </Button>
              </SheetFooter>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role '{roleToDelete?.name}'? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole}>Yes, Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={addAdminOpen} onOpenChange={setAddAdminOpen}>
        <SheetContent side="right" className="sm:max-w-md w-full flex flex-col">
          <div className="py-6 px-4 overflow-y-auto max-h-[calc(100vh-80px)]">
            <h2 className="text-2xl font-bold mb-1">Add New Admin User</h2>
            <p className="text-muted-foreground mb-6">Fill in the details below to add a new admin user to the system.</p>
            <form onSubmit={handleAddAdminSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  placeholder="e.g., John Doe"
                  value={addAdminForm.name}
                  onChange={e => setAddAdminForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  placeholder="e.g., john@company.com"
                  value={addAdminForm.email}
                  onChange={e => setAddAdminForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <Select
                  value={addAdminForm.roleName}
                  onValueChange={val => setAddAdminForm(f => ({ ...f, roleName: val }))}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {adminRoles.filter(role => role.name && role.name !== "").map(role => (
                      <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={addAdminForm.password}
                  onChange={e => setAddAdminForm(f => ({ ...f, password: e.target.value }))}
                  required
                  showPasswordToggle
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Re-enter password"
                  value={addAdminForm.confirmPassword}
                  onChange={e => setAddAdminForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  required
                  showPasswordToggle
                />
              </div>
              {((addAdminForm.roleName || '').toLowerCase().replace(/_/g, ' ') === 'sales admin') && (
                <div>
                  <label className="block text-sm font-medium mb-1">Referral Code</label>
                  <Input
                    type="text"
                    placeholder="Leave empty to auto-generate"
                    value={addAdminForm.referral_code}
                    onChange={e => setAddAdminForm(f => ({ ...f, referral_code: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A unique referral code for this sales admin. Leave empty to auto-generate.
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select value={addAdminForm.status} onValueChange={val => setAddAdminForm(f => ({ ...f, status: val }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 mt-6">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setAddAdminOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addAdminLoading} className="flex-1">
                  {addAdminLoading ? "Creating..." : "Add Admin User"}
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={createRoleOpen} onOpenChange={setCreateRoleOpen}>
        <SheetContent side="right" className="sm:max-w-sm w-full flex flex-col">
          <div className="py-6 px-4 overflow-y-auto max-h-[calc(100vh-80px)]">
            <h2 className="text-2xl font-bold mb-1">Add New Admin Role</h2>
            <p className="text-muted-foreground mb-6">Fill in the details below to add a new admin role to the system.</p>
            <form onSubmit={handleCreateRoleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">Role Name</label>
                <Input
                  placeholder="e.g., Super Admin"
                  value={createRoleForm.name}
                  onChange={e => setCreateRoleForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  placeholder="e.g., Full system access and control"
                  value={createRoleForm.description}
                  onChange={e => setCreateRoleForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Permissions</label>
                <div className="mb-2 flex items-center gap-2">
                  <Checkbox id="perm-select-all" checked={permSelectAll} onCheckedChange={(v: any) => {
                    const next = !!v; setPermSelectAll(next);
                    if (next) setCreateRoleForm(f => ({ ...f, permission_summary: JSON.stringify(PERMISSION_OPTIONS.map(p => p.key)) }));
                    else setCreateRoleForm(f => ({ ...f, permission_summary: JSON.stringify([]) }));
                  }} />
                  <label htmlFor="perm-select-all" className="text-sm">Select all</label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-auto border rounded p-2">
                  {PERMISSION_OPTIONS.map(opt => {
                    const current: string[] = (() => { try { return JSON.parse(createRoleForm.permission_summary || '[]'); } catch { return []; } })();
                    const checked = current.includes(opt.key);
                    return (
                      <label key={opt.key} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={checked} onCheckedChange={(v: any) => {
                          const isOn = !!v; const next = new Set(current);
                          if (isOn) next.add(opt.key); else next.delete(opt.key);
                          setCreateRoleForm(f => ({ ...f, permission_summary: JSON.stringify(Array.from(next)) }));
                        }} />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Only the selected pages will be visible to users with this role.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select value={createRoleForm.status} onValueChange={val => setCreateRoleForm(f => ({ ...f, status: val }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 mt-6">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateRoleOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createRoleLoading} className="flex-1">
                  {createRoleLoading ? "Creating..." : "Add Admin Role"}
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <SheetContent side="right" className="sm:max-w-md w-full flex flex-col">
          <div className="py-6 px-4 overflow-y-auto max-h-[calc(100vh-80px)]">
            <h2 className="text-2xl font-bold mb-1">Admin User Details</h2>
            <p className="text-muted-foreground mb-6">View all details for this admin user.</p>
            {userDetailsLoading ? (
              <div>Loading...</div>
            ) : userDetails ? (
              <div className="space-y-4">
                <div><span className="font-medium">Name:</span> {userDetails.name}</div>
                <div><span className="font-medium">Email:</span> {userDetails.email}</div>
                <div><span className="font-medium">Role:</span> {userDetails.roleName}</div>
                <div><span className="font-medium">Status:</span> {userDetails.status}</div>
                <div><span className="font-medium">Last Login:</span>
                  {userDetails.lastLogin && new Date(userDetails.lastLogin).getTime() > 0 && userDetails.lastLogin !== '1970-01-01T00:00:00.000Z'
                    ? new Date(userDetails.lastLogin).toLocaleString()
                    : 'N/A'}
                </div>
                <div><span className="font-medium">Created On:</span> {userDetails.createdOn ? new Date(userDetails.createdOn).toLocaleString() : '-'}</div>
              </div>
            ) : (
              <div className="text-destructive">Failed to load user details.</div>
            )}
            <div className="flex gap-2 mt-6">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setViewDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={editUserOpen} onOpenChange={setEditUserOpen}>
        <SheetContent side="right">
          <div className="py-6 px-4">
            <h2 className="text-2xl font-bold mb-1">Edit Admin User</h2>
            <p className="text-muted-foreground mb-6">Edit the details below and submit to update this admin user.</p>
            {editUserLoading ? (
              <div>Loading...</div>
            ) : (
              <form onSubmit={handleEditUserSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    placeholder="e.g., John Doe"
                    value={editUserForm.name}
                    onChange={e => setEditUserForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    placeholder="e.g., john@company.com"
                    value={editUserForm.email}
                    onChange={e => setEditUserForm(f => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <Select
                    value={editUserForm.roleName}
                    onValueChange={val => setEditUserForm(f => ({ ...f, roleName: val }))}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {adminRoles.filter(role => role.name && role.name !== "").map(role => (
                        <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <Input
                    type="password"
                    placeholder="Password cannot be changed here."
                    value={editUserForm.password}
                    readOnly
                    disabled
                  />
                </div>
                {((editUserForm.roleName || '').toLowerCase().replace(/_/g, ' ') === 'sales admin') && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Referral Code</label>
                    <Input
                      type="text"
                      placeholder="Leave empty to auto-generate"
                      value={editUserForm.referral_code}
                      onChange={e => setEditUserForm(f => ({ ...f, referral_code: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      A unique referral code for this sales admin. Leave empty to auto-generate.
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select value={editUserForm.status} onValueChange={val => setEditUserForm(f => ({ ...f, status: val }))}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setEditUserOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={editUserLoading} className="flex-1">
                    {editUserLoading ? "Updating..." : "Update Admin User"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <SheetContent side="right">
          <div className="py-6 px-4">
            <h2 className="text-2xl font-bold mb-1">Reset Admin Password</h2>
            <p className="text-muted-foreground mb-6">Change the password for this admin user.</p>
            {resetPasswordLoading ? (
              <div>Loading...</div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1">Admin Name</label>
                  <Input value={resetPasswordForm.name} readOnly disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Current Password</label>
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    value={resetPasswordForm.oldPassword}
                    onChange={e => setResetPasswordForm(f => ({ ...f, oldPassword: e.target.value }))}
                    required
                    showPasswordToggle
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">New Password</label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={resetPasswordForm.newPassword}
                    onChange={e => setResetPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                    required
                    showPasswordToggle
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="Re-enter new password"
                    value={resetPasswordForm.confirmPassword}
                    onChange={e => setResetPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    required
                    showPasswordToggle
                  />
                </div>
                <div className="flex gap-2 mt-6">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setResetPasswordOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={resetPasswordLoading} className="flex-1">
                    {resetPasswordLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={forceLogoutOpen} onOpenChange={setForceLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force Logout?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to force logout {userToForceLogout?.name}? This will immediately end their session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleForceLogout}>Yes, Force Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={viewActivityOpen} onOpenChange={setViewActivityOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>User Activity</SheetTitle>
          </SheetHeader>
          <div className="py-6 px-4">
            <h2 className="text-2xl font-bold mb-1">User Activity</h2>
            <p className="text-muted-foreground mb-6">Login and logout activity for {activityUser?.name}.</p>
            {activityLoading ? (
              <div>Loading...</div>
            ) : (
              <div className="space-y-3">
                {activityLogs.length === 0 ? (
                  <div className="text-muted-foreground">No activity found.</div>
                ) : (
                  activityLogs.map((log, idx) => (
                    <div key={idx} className="flex justify-between border-b pb-2">
                      <span className="font-medium">{log.type}</span>
                      <span className="text-sm text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            )}
            <div className="flex gap-2 mt-6">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setViewActivityOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteUserDialogOpen} onOpenChange={setDeleteUserDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the user '{userToDelete?.name}'? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>Yes, Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
