
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

// Mock data for client users
type ClientUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "Admin" | "Agent" | "Analyst" | "Viewer";
  status: "Active" | "Suspended" | "Pending";
  lastLogin?: string;
};

const initialMockClientUsers: ClientUser[] = [
  { id: "user_c1_01", name: "Alice Wonderland", email: "alice@innovatecorp.com", phone: "555-0100", role: "Admin", status: "Active", lastLogin: "2024-07-28" },
  { id: "user_c1_02", name: "Bob The Builder", email: "bob@innovatecorp.com", phone: "555-0101", role: "Agent", status: "Active", lastLogin: "2024-07-27" },
  { id: "user_c1_03", name: "Carol Danvers", email: "carol@innovatecorp.com", role: "Analyst", status: "Suspended", lastLogin: "2024-07-15" },
  { id: "user_c1_04", name: "David Copperfield", email: "david@innovatecorp.com", phone: "555-0102", role: "Agent", status: "Pending", lastLogin: "2024-07-29" },
];

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
  const [searchTerm, setSearchTerm] = React.useState("");
  const [clientUsers, setClientUsers] = React.useState<ClientUser[]>(initialMockClientUsers);
  const [isAddUserSheetOpen, setIsAddUserSheetOpen] = React.useState(false);

  const handleUserAction = (action: string, userId: string, userName: string) => {
     toast({ title: `Action: ${action}`, description: `Performed on user "${userName}" (ID: ${userId}) (Simulated)` });
     if (action === "Suspend" || action === "Activate") {
        setClientUsers(prevUsers => prevUsers.map(user => 
            user.id === userId ? {...user, status: user.status === "Active" ? "Suspended" : "Active" } : user
        ));
     }
  };

  const handleAddUserSuccess = (data: AddClientUserFormValues) => {
    const newUser: ClientUser = {
      id: `user_c1_${Date.now()}`,
      name: data.fullName,
      email: data.email,
      phone: data.phone,
      role: data.role,
      status: data.status,
      lastLogin: undefined, // New users haven't logged in
    };
    setClientUsers(prev => [newUser, ...prev]);
    setIsAddUserSheetOpen(false);
    toast({
      title: "User Added",
      description: `User "${data.fullName}" has been successfully added. (Simulated)`,
    });
  };

  const filteredUsers = clientUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.phone ? (
                      <div className="flex items-center">
                        <Phone className="mr-1.5 h-3.5 w-3.5 text-muted-foreground"/>{user.phone}
                      </div>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                     <Badge className={`text-xs ${roleVariants[user.role]}`}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                     <Badge className={`text-xs ${statusVariants[user.status]}`}>{user.status}</Badge>
                  </TableCell>
                  <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleUserAction("Edit", user.id, user.name)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUserAction("Reset Password", user.id, user.name)}>
                          <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => handleUserAction(user.status === 'Active' ? "Suspend" : "Activate", user.id, user.name)}>
                           {user.status === 'Active' ? <UserX className="mr-2 h-4 w-4 text-red-500" /> : <UserCheck className="mr-2 h-4 w-4 text-green-500" />}
                          {user.status === 'Active' ? "Suspend" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleUserAction("Delete", user.id, user.name)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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
