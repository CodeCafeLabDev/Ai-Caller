
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, MoreHorizontal, Edit, Trash2, KeyRound } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast"; // Import useToast
import * as React from "react"; // Import React

// Mock data for client users
const mockClientUsers = [
  { id: "user_c1_01", name: "Alice Wonderland", email: "alice@innovatecorp.com", role: "Administrator", status: "Active", lastLogin: "2024-07-28" },
  { id: "user_c1_02", name: "Bob The Builder", email: "bob@innovatecorp.com", role: "Campaign Manager", status: "Active", lastLogin: "2024-07-27" },
  { id: "user_c1_03", name: "Carol Danvers", email: "carol@innovatecorp.com", role: "Agent", status: "Suspended", lastLogin: "2024-07-15" },
  { id: "user_c1_04", name: "David Copperfield", email: "david@innovatecorp.com", role: "Agent", status: "Active", lastLogin: "2024-07-29" },
];

const statusVariants = {
  Active: "bg-green-100 text-green-700",
  Suspended: "bg-red-100 text-red-700",
};

export default function ClientUsersPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState("");

  const handleUserAction = (action: string, userName: string) => {
     toast({ title: `Action: ${action}`, description: `Performed on user "${userName}" (Simulated)` });
  };

  const filteredUsers = mockClientUsers.filter(user => 
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
        <Button size="lg" onClick={() => toast({ title: "Add New User", description: "User creation form/dialog for client admin to be implemented."})}>
          <UserPlus className="mr-2 h-5 w-5" /> Add New User
        </Button>
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
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                     <Badge className={`text-xs ${statusVariants[user.status as keyof typeof statusVariants]}`}>{user.status}</Badge>
                  </TableCell>
                  <TableCell>{user.lastLogin}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleUserAction("Edit", user.name)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUserAction("Reset Password", user.name)}>
                          <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => handleUserAction(user.status === 'Active' ? `Suspend ${user.name}` : `Activate ${user.name}`, user.name)}>
                           {user.status === 'Active' ? <UserPlus className="mr-2 h-4 w-4 text-red-500" /> : <UserPlus className="mr-2 h-4 w-4 text-green-500" />}
                          {user.status === 'Active' ? "Suspend" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleUserAction("Delete", user.name)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {filteredUsers.length === 0 && <p className="p-4 text-center text-muted-foreground">No users found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
