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
import { Users, UserPlus, MoreHorizontal, Edit, Trash2, KeyRound, UserX, UserCheck, Phone } from "lucide-react"; // Ensured all icons are imported
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AddClientUserForm, type AddClientUserFormValues } from "@/components/client-admin/users/add-client-user-form";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/apiConfig";
import { useUser } from '@/lib/utils';

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
  const [userRoles, setUserRoles] = React.useState<{ id: number; role_name: string; description: string; permissions_summary: string; status: string }[]>([]);

  React.useEffect(() => {
    api.getUserRoles()
      .then(res => res.json())
      .then(data => {
        if (data.success) setUserRoles(data.data || []);
      });
  }, []);

  React.useEffect(() => {
    if (!user?.userId) return;
    api.getClientUsers()
      .then(res => res.json())
      .then(data => {
        console.log("Fetched users in client admin panel:", data.data);
        setClientUsers(data.data || []);
      })
      .catch(() => {
        toast({ title: "Error", description: "Failed to fetch client users", variant: "destructive" });
      });
  }, [toast, user?.userId]);

  const handleUserAction = (action: string, userId: string, userName: string, currentStatus?: string) => {
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

  const filteredUsers = clientUsers.filter(user => {
    const name = user.full_name || user.name || "";
    const email = user.email || "";
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

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
    </div>
  );
}
