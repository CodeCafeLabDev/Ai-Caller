"use client";

import * as React from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, MoreHorizontal, Edit, Trash2, KeyRound, UserX, UserCheck, Phone, PlusCircle, ListChecks, Edit2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AddClientUserForm, type AddClientUserFormValues } from "@/components/client-admin/users/add-client-user-form";
import { EditClientUserForm, type EditClientUserFormValues } from "@/components/client-admin/users/edit-client-user-form";
import { ResetPasswordDialog } from "@/components/client-admin/users/reset-password-dialog";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/apiConfig";
import { useUser } from '@/lib/utils';
import { tokenStorage } from '@/lib/tokenStorage';
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data for client users
type ClientUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "Admin" | "Agent" | "Analyst" | "Viewer";
  status: "Active" | "Suspended" | "Pending";
  lastLogin?: string;
  full_name?: string; // Added for mock data
  role_name?: string; // Added for mock data
  last_login?: string; // Added for mock data
  role_id?: number; // Added for API data
  client_id?: string; // Added for API data
};

// Remove initialMockClientUsers and update ClientUser type to match API if needed
// type ClientUser = { ... } // (keep or update as needed)

const statusVariants = {
  Active: "bg-green-100 text-green-700",
  Suspended: "bg-red-100 text-red-700",
  Pending: "bg-orange-100 text-orange-700",
};

const roleVariants = {
  Admin: "bg-purple-100 text-purple-700",
  Agent: "bg-blue-100 text-blue-700",
  Analyst: "bg-sky-100 text-sky-700",
  Viewer: "bg-gray-100 text-gray-700",
};

export default function ClientUsersPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [clientUsers, setClientUsers] = React.useState<ClientUser[]>([]); // Start with empty array
  const [isAddUserSheetOpen, setIsAddUserSheetOpen] = React.useState(false);
  const [isEditUserSheetOpen, setIsEditUserSheetOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<ClientUser | null>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = React.useState(false);
  const [userForPasswordReset, setUserForPasswordReset] = React.useState<{ id: string; name: string } | null>(null);
  const [userRoles, setUserRoles] = React.useState<{ id: number; role_name: string; description: string; permissions_summary: string; status: string }[]>([]);
  
  // User Roles Management State
  const [createRoleOpen, setCreateRoleOpen] = React.useState(false);
  const [createRoleLoading, setCreateRoleLoading] = React.useState(false);
  const [createRoleForm, setCreateRoleForm] = React.useState({ name: "", description: "", permission_summary: "", status: "Active" });
  const [editRoleOpen, setEditRoleOpen] = React.useState(false);
  const [editRoleLoading, setEditRoleLoading] = React.useState(false);
  const [editRoleForm, setEditRoleForm] = React.useState({ name: "", description: "", permission_summary: "", status: "Active" });
  const [roleBeingEdited, setRoleBeingEdited] = React.useState<{ id: number; role_name: string; description: string; permissions_summary: string; status: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [roleToDelete, setRoleToDelete] = React.useState<{ id: number; role_name: string; description: string; permissions_summary: string; status: string } | null>(null);
  const [permSelectAll, setPermSelectAll] = React.useState<boolean>(false);
  const [editPermSelectAll, setEditPermSelectAll] = React.useState<boolean>(false);
  
  // Permission options for client roles (matching client panel structure)
  const PERMISSION_OPTIONS = React.useMemo(() => [
    { key: 'view:dashboard', label: 'Dashboard' },
    { key: 'view:campaigns', label: 'Campaigns' },
    { key: 'view:campaigns_active_paused', label: 'Active & Paused Campaigns' },
    { key: 'view:campaigns_monitor_live', label: 'Monitor Live Campaigns' },
    { key: 'view:campaigns_top_performing', label: 'Top Performing Campaigns' },
    { key: 'view:agents', label: 'AI Agents' },
    { key: 'view:agents_create', label: 'Create AI Agents' },
    { key: 'view:agents_import_export', label: 'Import/Export Agents' },
    { key: 'view:agents_knowledge_base', label: 'Knowledge Base' },
    { key: 'view:agents_language_settings', label: 'Language Settings' },
    { key: 'view:agents_voices', label: 'Voice Settings' },
    { key: 'view:reports', label: 'Reports & Analytics' },
    { key: 'view:reports_call_reports', label: 'Call Reports' },
    { key: 'view:reports_error_logs', label: 'Error Logs' },
    { key: 'view:reports_export_data', label: 'Export Data' },
    { key: 'view:reports_failed_call_reports', label: 'Failed Call Reports' },
    { key: 'view:reports_system_usage_trends', label: 'System Usage Trends' },
    { key: 'view:users', label: 'Team Users' },
    { key: 'view:billing', label: 'Billing' },
    { key: 'view:profile', label: 'Profile' },
    { key: 'edit:campaigns', label: 'Edit Campaigns' },
    { key: 'edit:agents', label: 'Edit AI Agents' },
    { key: 'create:campaigns', label: 'Create Campaigns' },
    { key: 'create:agents', label: 'Create AI Agents' },
    { key: 'delete:campaigns', label: 'Delete Campaigns' },
    { key: 'delete:agents', label: 'Delete AI Agents' },
    { key: 'manage:users', label: 'Manage Team Users' },
    { key: 'manage:roles', label: 'Manage User Roles' },
  ], []);

  React.useEffect(() => {
    // Check authentication before making API call
    const token = tokenStorage.getToken();
    if (!token) {
      console.warn('No authentication token found for getUserRoles');
      return;
    }

    api.getClientRoles()
      .then(res => {
        if (!res.ok) {
          if (res.status === 401) {
            console.warn('Authentication failed for getClientRoles. Token may be expired.');
            return;
          }
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Client roles data received:', data);
        if (data && data.success) {
          setUserRoles(data.data || []);
          console.log('Client roles set:', data.data);
        }
      })
      .catch(error => {
        console.error('Error fetching client roles:', error);
      });
  }, []);

  React.useEffect(() => {
    if (!user?.userId) return;
    
    // Check authentication before making API call
    const token = tokenStorage.getToken();
    if (!token) {
      console.warn('No authentication token found for getClientUsers');
      return;
    }

    api.getClientUsers()
      .then(res => {
        if (!res.ok) {
          if (res.status === 401) {
            console.warn('Authentication failed for getClientUsers. Token may be expired.');
            return;
          }
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        if (data) {
          console.log("Fetched users in client admin panel:", data.data);
          setClientUsers(data.data || []);
        }
      })
      .catch((error) => {
        console.error('Error fetching client users:', error);
        toast({ title: "Error", description: "Failed to fetch client users", variant: "destructive" });
      });
  }, [toast, user?.userId]);

  const handleUserAction = (action: string, userId: string, userName: string, currentStatus?: string) => {
    if (action === "Edit") {
      const userToEdit = clientUsers.find(u => u.id === userId);
      if (userToEdit) {
        setEditingUser(userToEdit);
        setIsEditUserSheetOpen(true);
      }
      return;
    }
    if (action === "Reset Password") {
      setUserForPasswordReset({ id: userId, name: userName });
      setResetPasswordDialogOpen(true);
      return;
    }
    if (action === "Suspend" || action === "Activate") {
      const newStatus = action === "Suspend" ? "Suspended" : "Active";
      const userToUpdate = clientUsers.find(u => u.id === userId);
      if (!userToUpdate) return;
      api.updateClientUser(userId, {
        ...userToUpdate,
        status: newStatus,
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setClientUsers(prevUsers => prevUsers.map(user =>
              user.id === userId ? { ...user, status: newStatus } : user
            ));
            toast({ title: `User ${action}d`, description: `${userName} is now ${newStatus}.` });
          } else {
            toast({ title: "Error", description: data.message || `Failed to ${action.toLowerCase()} user.`, variant: "destructive" });
          }
        })
        .catch(() => {
          toast({ title: "Error", description: `Error trying to ${action.toLowerCase()} user.`, variant: "destructive" });
        });
      return;
    }
    if (action === "Delete") {
      if (!window.confirm(`Are you sure you want to delete user ${userName}?`)) return;
      api.deleteClientUser(userId)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setClientUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
            toast({ title: "User Deleted", description: `${userName} has been deleted.` });
          } else {
            toast({ title: "Error", description: data.message || "Failed to delete user.", variant: "destructive" });
          }
        })
        .catch(() => {
          toast({ title: "Error", description: "Error deleting user.", variant: "destructive" });
        });
      return;
    }
    toast({ title: `Action: ${action}`, description: `Performed on user "${userName}" (ID: ${userId}) (Simulated)` });
  };

  const handleAddUserSuccess = (data: AddClientUserFormValues) => {
    if (!user?.userId) return;
    api.createClientUser({
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      role_id: Number(data.role),
      status: data.status,
      last_login: null,
      client_id: user.userId,
      password: data.password,
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setClientUsers(prev => [result.data, ...prev]);
          setIsAddUserSheetOpen(false);
          toast({
            title: "User Added",
            description: `User \"${result.data.full_name || result.data.name}\" has been successfully added.`,
          });
        } else {
          toast({ title: "Error", description: result.message || "Failed to add user", variant: "destructive" });
        }
      });
  };

  const handleEditUserSuccess = (data: EditClientUserFormValues) => {
    if (!editingUser) return;
    
    api.updateClientUser(editingUser.id, {
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      role_id: Number(data.role),
      status: data.status,
      last_login: editingUser.last_login,
      client_id: editingUser.client_id || user?.userId,
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setClientUsers(prevUsers => prevUsers.map(user =>
            user.id === editingUser.id ? { ...user, ...result.data } : user
          ));
          setIsEditUserSheetOpen(false);
          setEditingUser(null);
          toast({
            title: "User Updated",
            description: `User \"${data.fullName}\" has been successfully updated.`,
          });
        } else {
          toast({ title: "Error", description: result.message || "Failed to update user", variant: "destructive" });
        }
      })
      .catch(error => {
        console.error("Error updating user:", error);
        toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
      });
  };

  const handleResetPasswordSuccess = () => {
    setResetPasswordDialogOpen(false);
    setUserForPasswordReset(null);
  };

  const filteredUsers = clientUsers.filter(user => {
    const name = user.full_name || user.name || "";
    const email = user.email || "";
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Role Management Functions
  React.useEffect(() => {
    if (roleBeingEdited) {
      setEditRoleForm({
        name: roleBeingEdited.role_name || "",
        description: roleBeingEdited.description || "",
        permission_summary: roleBeingEdited.permissions_summary || "",
        status: roleBeingEdited.status || "Active",
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

  async function handleCreateRoleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!createRoleForm.name) {
      toast({ title: "Invalid Role Name", description: "Role name is required.", variant: "destructive" });
      return;
    }
    setCreateRoleLoading(true);
    try {
      const res = await api.createClientRole(createRoleForm);
      if (res.ok) {
        const created = await res.json();
        setUserRoles((prev) => [created.data, ...prev]);
        setCreateRoleOpen(false);
        setCreateRoleForm({ name: "", description: "", permission_summary: "", status: "Active" });
        toast({ title: "Client Role Created", description: "The client role was created successfully." });
      } else {
        toast({ title: "Create Failed", description: "Could not create client role.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Create Failed", description: "Could not create client role.", variant: "destructive" });
    }
    setCreateRoleLoading(false);
  }

  async function handleEditRoleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roleBeingEdited) return;
    setEditRoleLoading(true);
    try {
      const res = await api.updateClientRole(roleBeingEdited.id.toString(), editRoleForm);
      if (res.ok) {
        const updated = await res.json();
        setUserRoles((prev) => prev.map((r) => r.id === roleBeingEdited.id ? { ...r, ...updated.data } : r));
        setEditRoleOpen(false);
        toast({ title: "Role Updated", description: "The client role was updated successfully." });
      } else {
        toast({ title: "Update Failed", description: "Could not update role.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Update Failed", description: "Could not update role.", variant: "destructive" });
    }
    setEditRoleLoading(false);
  }

  async function handleDeleteRole() {
    if (!roleToDelete) return;
    try {
      const res = await api.deleteClientRole(roleToDelete.id.toString());
      if (res.ok) {
        setUserRoles((prev) => prev.filter((r) => r.id !== roleToDelete.id));
        toast({ title: "Role Deleted", description: `Role '${roleToDelete.role_name}' deleted successfully.` });
      } else {
        toast({ title: "Delete Failed", description: "Could not delete role.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Delete Failed", description: "Could not delete role.", variant: "destructive" });
    }
    setDeleteDialogOpen(false);
    setRoleToDelete(null);
  }

  // Debug logging
  console.log('Rendering userRoles:', userRoles);

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <Users className="mr-2 h-7 w-7" /> Manage Team Users
          </h1>
          <p className="text-muted-foreground">Add, edit, and manage users for your account.</p>
        </div>
        <Sheet open={isAddUserSheetOpen} onOpenChange={setIsAddUserSheetOpen}>
          <SheetTrigger asChild>
            <Button size="lg" onClick={() => setIsAddUserSheetOpen(true)}>
              <UserPlus className="mr-2 h-5 w-5" /> Add New User
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md w-full flex flex-col" side="right">
            <SheetHeader>
              <SheetTitle>Add New Team User</SheetTitle>
              <SheetDescription>
                Fill in the details to create a new user for your team.
              </SheetDescription>
            </SheetHeader>
            <AddClientUserForm 
              onSuccess={handleAddUserSuccess} 
              onCancel={() => setIsAddUserSheetOpen(false)}
              userRoles={userRoles}
            />
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>Overview of all users associated with your client account.</CardDescription>
          <div className="pt-4">
            <Input 
              placeholder="Search users by name or email..." 
              className="max-w-sm h-9" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name || user.name}</TableCell>
                  <TableCell>
                    <div>{user.email}</div>
                    {user.phone && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {user.phone}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-blue-100 text-blue-700">{user.role_name || user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        user.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : user.status === "Suspended"
                          ? "bg-red-100 text-red-700"
                          : "bg-orange-100 text-orange-700"
                      }>
                        {user.status}
                      </Badge>
                      <Switch
                        checked={user.status === "Active"}
                        onCheckedChange={() => handleUserAction(user.status === "Active" ? "Suspend" : "Activate", user.id, user.full_name || user.name, user.status)}
                        aria-label="Toggle user status"
                      />
                    </div>
                  </TableCell>
                  <TableCell>{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleUserAction("Edit", user.id, user.full_name || user.name)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUserAction("Reset Password", user.id, user.full_name || user.name)}>
                          <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => handleUserAction(user.status === 'Active' ? "Suspend" : "Activate", user.id, user.full_name || user.name, user.status)}>
                           {user.status === 'Active' ? <UserX className="mr-2 h-4 w-4 text-red-500" /> : <UserCheck className="mr-2 h-4 w-4 text-green-500" />}
                          {user.status === 'Active' ? "Suspend" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleUserAction("Delete", user.id, user.full_name || user.name)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No users found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Roles Section */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>User Roles</CardTitle>
            <CardDescription>Define and manage roles with specific permission sets.</CardDescription>
          </div>
          <Button onClick={() => setCreateRoleOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Role
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
              {userRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No roles found. Create your first role to get started.
                  </TableCell>
                </TableRow>
              ) : userRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.role_name || '—'}</TableCell>
                  <TableCell>{role.description || '—'}</TableCell>
                  <TableCell>
                    {(() => {
                      const raw = role.permissions_summary || '';
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
                    <Badge className={
                      (role.status || '').toLowerCase() === 'active' 
                        ? "bg-green-100 text-green-700" 
                        : "bg-gray-100 text-gray-700"
                    }>
                      {role.status || 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Role Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => { setRoleBeingEdited(role); setEditRoleOpen(true); }}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => { setRoleToDelete(role); setDeleteDialogOpen(true); }}
                          className="text-destructive focus:text-destructive"
                        >
                          Delete Role
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={async () => {
                          const currentStatus = (role.status || '').toLowerCase();
                          const newStatus = currentStatus === 'active' ? 'Archived' : 'Active';
                          console.log('Deactivate/Activate role:', { roleId: role.id, currentStatus, newStatus, roleData: role });
                          
                          try {
                            const updateData = { ...role, status: newStatus };
                            console.log('Sending update data:', updateData);
                            
                            const res = await api.updateClientRole(role.id.toString(), updateData);
                            console.log('Update response status:', res.status, 'ok:', res.ok);
                            
                            if (res.ok) {
                              const result = await res.json();
                              console.log('Update result:', result);
                              setUserRoles(prev => prev.map(r => r.id === role.id ? { ...r, status: newStatus } : r));
                              toast({ title: `Role ${newStatus === 'Active' ? 'Activated' : 'Archived'}`, description: `Role status updated to ${newStatus}.` });
                            } else {
                              const errorResult = await res.json();
                              console.error('Update failed:', errorResult);
                              toast({ title: 'Update Failed', description: errorResult.message || 'Could not update role status.', variant: 'destructive' });
                            }
                          } catch (error) {
                            console.error('Update error:', error);
                            toast({ title: 'Update Failed', description: 'Could not update role status.', variant: 'destructive' });
                          }
                        }}>
                          {(role.status || '').toLowerCase() === 'active' ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                          {(role.status || '').toLowerCase() === 'active' ? 'Archive' : 'Activate'}
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

      {/* Create Role Sheet */}
      <Sheet open={createRoleOpen} onOpenChange={setCreateRoleOpen}>
        <SheetContent side="right" className="sm:max-w-sm w-full flex flex-col">
          <div className="py-6 px-4 overflow-y-auto max-h-[calc(100vh-80px)]">
            <h2 className="text-2xl font-bold mb-1">Add New Role</h2>
            <p className="text-muted-foreground mb-6">Fill in the details below to add a new role to the system.</p>
            <form onSubmit={handleCreateRoleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">Role Name</label>
                <Input
                  placeholder="e.g., Viewer"
                  value={createRoleForm.name}
                  onChange={e => setCreateRoleForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  placeholder="e.g., Can view only"
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
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 mt-6">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateRoleOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createRoleLoading} className="flex-1">
                  {createRoleLoading ? "Creating..." : "Add Role"}
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Role Sheet */}
      <Sheet open={editRoleOpen} onOpenChange={setEditRoleOpen}>
        <SheetContent side="right" className="sm:max-w-sm w-full flex flex-col">
          <div className="py-6 px-4 overflow-y-auto max-h-[calc(100vh-80px)]">
            <h2 className="text-2xl font-bold mb-1">Edit Role</h2>
            <p className="text-muted-foreground mb-6">Update the details below and submit to update this role.</p>
            <form onSubmit={handleEditRoleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">Role Name</label>
                <Input
                  placeholder="e.g., Viewer"
                  value={editRoleForm.name}
                  onChange={e => setEditRoleForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  placeholder="e.g., Can view only"
                  value={editRoleForm.description}
                  onChange={e => setEditRoleForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
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
                <p className="text-xs text-muted-foreground mt-1">Only the selected pages will be visible to users with this role.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select value={editRoleForm.status} onValueChange={val => setEditRoleForm(f => ({ ...f, status: val }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 mt-6">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setEditRoleOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editRoleLoading} className="flex-1">
                  {editRoleLoading ? "Updating..." : "Update Role"}
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Role Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role '{roleToDelete?.role_name}'? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole}>Yes, Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Sheet */}
      <Sheet open={isEditUserSheetOpen} onOpenChange={setIsEditUserSheetOpen}>
        <SheetContent className="sm:max-w-md w-full flex flex-col" side="right">
          <SheetHeader>
            <SheetTitle>Edit User</SheetTitle>
            <SheetDescription>
              Update the user information below.
            </SheetDescription>
          </SheetHeader>
          {editingUser && (
            <EditClientUserForm 
              user={editingUser}
              userRoles={userRoles}
              onSuccess={handleEditUserSuccess} 
              onCancel={() => {
                setIsEditUserSheetOpen(false);
                setEditingUser(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Reset Password Dialog */}
      {userForPasswordReset && (
        <ResetPasswordDialog
          isOpen={resetPasswordDialogOpen}
          onClose={() => {
            setResetPasswordDialogOpen(false);
            setUserForPasswordReset(null);
          }}
          userName={userForPasswordReset.name}
          userId={userForPasswordReset.id}
          onSuccess={handleResetPasswordSuccess}
        />
      )}
    </div>
  );
}
