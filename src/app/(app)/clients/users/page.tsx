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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PlusCircle,
  ListFilter,
  MoreHorizontal,
  Edit,
  KeyRound,
  UserX,
  UserCheck,
  UserCog,
  ShieldQuestion,
  Phone,
  Users, 
  Check, 
  ChevronsUpDown,
  Edit2,
  ListChecks
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from "next/navigation";
import { Switch } from "@/components/ui/switch";

// export const metadata: Metadata = {
//   title: 'Client Users Management - AI Caller',
//   description: 'Manage user accounts within client organizations, including roles and statuses.',
//   keywords: ['client users', 'user management', 'roles', 'permissions', 'AI Caller'],
// };

type ClientUser = {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role_id: number;
  role_name?: string;
  status: "Active" | "Suspended" | "Pending";
  last_login?: string;
  client_id: string;
  plan_id?: string;
};

type Plan = {
  id: number;
  name: string;
  // Add other fields if needed
};

type UserFormState = Partial<ClientUser> & { password?: string; confirmPassword?: string };

const mockClientsForSelection = [
  { id: "client_1", name: "Innovate Corp" },
  { id: "client_2", name: "Solutions Ltd" },
  { id: "client_3", name: "Tech Ventures" },
  { id: "client_4", name: "Global Connect" },
  { id: "client_5", name: "Synergy Systems" },
];

const roleColors: Record<string, string> = {
  Admin: "bg-purple-100 text-purple-700 dark:bg-purple-700 dark:text-purple-100",
  Agent: "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100",
  Analyst: "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100",
  Viewer: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100",
};

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
  Suspended: "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100",
  Pending: "bg-orange-100 text-orange-700 dark:bg-orange-700 dark:text-orange-100",
};

const statusOptions: string[] = ["Active", "Suspended", "Pending"];

export default function ClientUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [userRoles, setUserRoles] = useState<{ id: number; role_name: string; description: string; permissions_summary: string; status: "Active" | "Archived" }[]>([]);
  const [roleFilter, setRoleFilter] = useState<string | "all">("all");
  const [isAddUserSheetOpen, setIsAddUserSheetOpen] = useState(false);
  const [clientComboboxOpen, setClientComboboxOpen] = useState(false);
  const [roleFilterComboboxOpen, setRoleFilterComboboxOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ClientUser | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [form, setForm] = useState<UserFormState>({});
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [clients, setClients] = useState<{ id: string; companyName: string }[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [resetPasswordSheetOpen, setResetPasswordSheetOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetUserName, setResetUserName] = useState<string>("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);

  React.useEffect(() => {
    // Fetch users from backend
    fetch("http://localhost:5000/api/client-users")
      .then(res => res.json())
      .then(data => setUsers(data.data || []));
    // Fetch user roles from backend
    fetch("http://localhost:5000/api/user-roles")
      .then(res => res.json())
      .then(data => setUserRoles(data.data || []));
    fetch("http://localhost:5000/api/clients")
      .then(res => res.json())
      .then(data => setClients(data.data || []));
    fetch("http://localhost:5000/api/plans")
      .then(res => res.json())
      .then(data => {
        if (data.success) setPlans(data.data);
      });
  }, []);

  const handleUserAction = async (action: string, userId: number, userName: string) => {
    let newStatus = null;
    if (action === "Deactivate") newStatus = "Suspended";
    if (action === "Activate") newStatus = "Active";
    if (newStatus) {
      try {
        // 1. Fetch the full user data
        const resGet = await fetch(`http://localhost:5000/api/client-users/${userId}`);
        const dataGet = await resGet.json();
        if (!dataGet.success) {
          toast({ title: 'Error', description: 'Failed to fetch user data', variant: 'destructive' });
          return;
        }
        // 2. Update status
        const userData = { ...dataGet.data, status: newStatus };
        // 3. Send full object in PUT request
        const res = await fetch(`http://localhost:5000/api/client-users/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });
        const data = await res.json();
        if (data.success) {
          setUsers(prevUsers => prevUsers.map(user =>
            user.id === userId ? { ...user, status: newStatus as "Active" | "Suspended" | "Pending" } : user
          ));
          toast({ title: `User ${action}d`, description: `${userName} is now ${newStatus}.` });
        } else {
          toast({ title: "Error", description: data.message || `Failed to ${action.toLowerCase()} user.`, variant: "destructive" });
        }
      } catch (err) {
        toast({ title: "Error", description: `Error trying to ${action.toLowerCase()} user.`, variant: "destructive" });
      }
      return;
    }
    toast({
      title: `Action: ${action}`,
      description: `Performed on ${userName} (ID: ${userId}). (Simulated)`,
    });
  };
  
  const onAddUserSubmit = (data: Partial<ClientUser>) => {
    console.log("New User Data:", data);
    const newUser: ClientUser = {
      id: Date.now(),
      full_name: data.full_name || "",
      email: data.email || "",
      phone: data.phone || "",
      role_id: data.role_id || 0,
      role_name: data.role_name || "",
      status: (data.status as "Active" | "Suspended" | "Pending") || "Active",
      last_login: undefined,
      client_id: data.client_id || "",
      plan_id: data.plan_id || "",
    };
    setUsers(prev => [newUser, ...prev]);
    toast({
      title: "User Added (Simulated)",
      description: `${data.full_name} for client ID ${data.client_id} has been added successfully.`,
    });
    setIsAddUserSheetOpen(false);
  };

  const filteredUsers = users.filter(user => 
    roleFilter === "all" || user.role_id === (userRoles.find(r => r.role_name === roleFilter)?.id)
  );

  const handleAdminRoleAction = (actionName: string, roleName: string) => {
    toast({
      title: `Admin Role Action: ${actionName}`,
      description: `Performed on role ${roleName}. (Simulated)`,
    });
  };

  const openAddUser = () => {
    setEditingUser(null);
    setForm({});
    setShowUserForm(true);
  };

  const openEditUser = (user: ClientUser) => {
    setEditingUser(user);
    setForm(user);
    setShowUserForm(true);
  };

  const closeUserForm = () => {
    setEditingUser(null);
    setForm({});
    setShowUserForm(false);
    setIsAddUserSheetOpen(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUserFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.client_id || !form.role_id || !form.status || !form.password || !form.confirmPassword) {
      toast({ title: "Error", description: "Please fill all required fields." });
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match." });
      return;
    }
    if (editingUser) {
      // Edit
      fetch(`http://localhost:5000/api/client-users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
        .then(res => res.json())
        .then(data => {
          setUsers(users => users.map(u => u.id === editingUser.id ? data.data : u));
          closeUserForm();
          setForm({});
        });
    } else {
      // Add
      const clientData = { ...form };
      fetch("http://localhost:5000/api/client-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      })
        .then(res => res.json())
        .then(data => {
          setUsers(users => [data.data, ...users]);
          closeUserForm();
          setForm({});
        });
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const res = await fetch(`http://localhost:5000/api/client-users/${id}`, { method: "DELETE" });
    if (res.ok) setUsers(users => users.filter(u => u.id !== id));
  };

  const openResetPasswordSheet = (user: ClientUser) => {
    setResetUserId(user.id);
    setResetUserName(user.full_name);
    setResetPassword("");
    setResetConfirmPassword("");
    setResetPasswordSheetOpen(true);
  };

  const closeResetPasswordSheet = () => {
    setResetUserId(null);
    setResetUserName("");
    setResetPassword("");
    setResetConfirmPassword("");
    setResetPasswordSheetOpen(false);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassword || !resetConfirmPassword) {
      toast({ title: "Error", description: "Please fill all password fields." });
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      toast({ title: "Error", description: "Passwords do not match." });
      return;
    }
    setResetSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/client-users/${resetUserId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Password reset successfully!" });
        closeResetPasswordSheet();
      } else {
        toast({ title: "Error", description: data.message || "Failed to reset password.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Error resetting password.", variant: "destructive" });
    }
    setResetSubmitting(false);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Client Users Management</h1>
          <p className="text-muted-foreground">Manage user accounts within client organizations.</p>
        </div>
        <Sheet open={isAddUserSheetOpen} onOpenChange={setIsAddUserSheetOpen}>
          <SheetTrigger asChild>
            <Button size="lg" onClick={() => setIsAddUserSheetOpen(true)}>
              <PlusCircle className="mr-2 h-5 w-5" />
              Add New User
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md w-full">
            <SheetHeader>
              <SheetTitle>Add New User</SheetTitle>
              <SheetDescription>
                Fill in the details to create a new user account.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleUserFormSubmit} className="flex flex-col h-full">
              <ScrollArea className="flex-grow">
                <div className="space-y-4 py-4 px-2">
                  <div className="flex flex-col">
                    <Label>Assign to Client</Label>
                    <Select
                      value={form.client_id?.toString() || ""}
                      onValueChange={val => setForm({ ...form, client_id: val })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Assign to Client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={String(client.id)}>
                            {client.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col">
                    <Label>Full Name</Label>
                    <Input placeholder="e.g., John Doe" name="full_name" value={form.full_name || ""} onChange={handleFormChange} />
                  </div>
                  <div className="flex flex-col">
                    <Label>Email Address</Label>
                    <Input type="email" placeholder="user@example.com" name="email" value={form.email || ""} onChange={handleFormChange} />
                  </div>
                  <div className="flex flex-col">
                    <Label>Phone Number (Optional)</Label>
                    <Input type="tel" placeholder="555-123-4567" name="phone" value={form.phone || ""} onChange={handleFormChange} />
                  </div>
                  <div className="flex flex-col">
                    <Label>Role</Label>
                    <Select
                      onValueChange={(val) => setForm({ ...form, role_id: Number(val) })}
                      value={form.role_id?.toString() || ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {userRoles.map((role) => (
                          <SelectItem key={role.id} value={String(role.id)}>
                            {role.role_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col">
                    <Label>Status</Label>
                    <Select
                      onValueChange={(val) => setForm({ ...form, status: val as "Active" | "Suspended" | "Pending" })}
                      value={form.status || "Active"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col">
                    <Label>Status Toggle</Label>
                    <Switch
                      checked={form.status === "Active"}
                      onCheckedChange={checked => setForm({ ...form, status: checked ? "Active" : "Suspended" })}
                      aria-label="Toggle user status"
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      placeholder="Enter password"
                      name="password"
                      value={form.password || ""}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label>Confirm Password</Label>
                    <Input
                      type="password"
                      placeholder="Confirm password"
                      name="confirmPassword"
                      value={form.confirmPassword || ""}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <SheetClose asChild>
                      <Button type="button" variant="outline">Cancel</Button>
                    </SheetClose>
                    <Button type="submit" disabled={!form.full_name || !form.email || !form.client_id || !form.role_id || !form.status || !form.password || !form.confirmPassword}>
                      {editingUser ? "Update" : "Add"}
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex items-center gap-4 p-4 border rounded-lg shadow-sm bg-card">
        <Label htmlFor="role-filter-combobox" className="text-sm font-medium">Filter by Role:</Label>
        <Popover open={roleFilterComboboxOpen} onOpenChange={setRoleFilterComboboxOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={roleFilterComboboxOpen}
              id="role-filter-combobox"
              className="w-full md:w-[200px] justify-between"
            >
              <ListFilter className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              {roleFilter === "all" ? "Filter by Role" : roleFilter}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Search role..." />
              <CommandList>
                <CommandEmpty>No role found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      setRoleFilter("all");
                      setRoleFilterComboboxOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        roleFilter === "all" ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All Roles
                  </CommandItem>
                  {userRoles.map((role) => (
                    <CommandItem
                      key={role.id}
                      value={role.role_name}
                      onSelect={() => {
                        setRoleFilter(role.role_name as string | "all");
                        setRoleFilterComboboxOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          roleFilter === role.role_name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {role.role_name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <ScrollArea className="rounded-lg border shadow-sm">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Client Users</CardTitle>
            <CardDescription>Define and manage roles with specific permission sets.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>
                  <div>{user.email}</div>
                  {user.phone && <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3"/>{user.phone}</div>}
                </TableCell>
                <TableCell>
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100">{userRoles.find(r => r.id === user.role_id)?.role_name}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge className={`${statusColors[user.status]}`}>{user.status}</Badge>
                    <Switch
                      checked={user.status === "Active"}
                      onCheckedChange={() => handleUserAction(user.status === "Active" ? "Deactivate" : "Activate", user.id, user.full_name)}
                      aria-label="Toggle user status"
                    />
                  </div>
                </TableCell>
                <TableCell>{user.last_login ? format(new Date(user.last_login), "MMM dd, yyyy") : 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/clients/users/edit/${user.id}`}>
                          <Edit className="mr-2 h-4 w-4" /> Edit User
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openResetPasswordSheet(user)}>
                        <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user.status === "Active" ? (
                        <DropdownMenuItem className="text-yellow-600 focus:bg-yellow-50 focus:text-yellow-700" onClick={() => handleUserAction("Deactivate", user.id, user.full_name)}>
                          <UserX className="mr-2 h-4 w-4" /> Deactivate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem className="text-green-600 focus:bg-green-50 focus:text-green-700" onClick={() => handleUserAction("Activate", user.id, user.full_name)}>
                          <UserCheck className="mr-2 h-4 w-4" /> Activate
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleUserAction("Impersonate", user.id, user.full_name)}>
                        <UserCog className="mr-2 h-4 w-4" /> Impersonate
                      </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => handleUserAction("View Permissions", user.id, user.full_name)}>
                        <ShieldQuestion className="mr-2 h-4 w-4" /> View Permissions
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No users found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </CardContent>
        </Card>
      </ScrollArea>
       {filteredUsers.length > 10 && ( 
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      )}

      {/* Client Roles Section */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>User Roles</CardTitle>
            <CardDescription>Define and manage roles with specific permission sets.</CardDescription>
          </div>
          <Link href="/clients/users/roles/create">
            <Button>
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Role
            </Button>
          </Link>
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
              {userRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.role_name}</TableCell>
                  <TableCell className="max-w-sm truncate" title={role.description}>{role.description}</TableCell>
                  <TableCell className="max-w-xs truncate" title={role.permissions_summary}>{role.permissions_summary}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={role.status === "Active" ? "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100" : "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100"}>{role.status}</Badge>
                      <Switch
                        checked={role.status === "Active"}
                        onCheckedChange={() => handleAdminRoleAction(role.status === "Active" ? "Archive" : "Activate", role.role_name)}
                        aria-label="Toggle role status"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Role Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/clients/users/roles/edit/${role.id}`}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit Role
                          </Link>
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
      <Sheet open={resetPasswordSheetOpen} onOpenChange={setResetPasswordSheetOpen}>
        <SheetContent className="sm:max-w-md w-full">
          <SheetHeader>
            <SheetTitle>Reset Password</SheetTitle>
            <SheetDescription>
              Change password for <span className="font-semibold">{resetUserName}</span>.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleResetPasswordSubmit} className="flex flex-col h-full">
            <div className="space-y-4 py-4 px-2 flex-grow">
              <div className="flex flex-col">
                <Label>New Password</Label>
                <Input type="password" placeholder="Enter new password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} required />
              </div>
              <div className="flex flex-col">
                <Label>Confirm New Password</Label>
                <Input type="password" placeholder="Confirm new password" value={resetConfirmPassword} onChange={e => setResetConfirmPassword(e.target.value)} required />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <SheetClose asChild>
                  <Button type="button" variant="outline" onClick={closeResetPasswordSheet}>Cancel</Button>
                </SheetClose>
                <Button type="submit" disabled={resetSubmitting || !resetPassword || !resetConfirmPassword}>
                  {resetSubmitting ? "Saving..." : "Reset Password"}
                </Button>
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
