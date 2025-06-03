
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
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
import { MoreHorizontal, PlusCircle, Edit, KeyRound, UserX, UserCheck, UserCog, ShieldQuestion } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

type ClientUser = {
  id: string;
  fullName: string;
  email: string;
  role: "Admin" | "Agent" | "Analyst" | "Viewer";
  status: "Active" | "Suspended" | "Pending";
  lastLogin?: string;
};

const mockClientUsers: ClientUser[] = [
  { id: "user1", fullName: "John Doe", email: "john.doe@innovatecorp.com", role: "Admin", status: "Active", lastLogin: "2024-07-15" },
  { id: "user2", fullName: "Jane Smith", email: "jane.smith@innovatecorp.com", role: "Agent", status: "Active", lastLogin: "2024-07-14" },
  { id: "user3", fullName: "Robert Brown", email: "robert.brown@innovatecorp.com", role: "Analyst", status: "Suspended", lastLogin: "2024-06-20" },
  { id: "user4", fullName: "Emily White", email: "emily.white@innovatecorp.com", role: "Viewer", status: "Pending" },
];

const roleColors: Record<ClientUser["role"], string> = {
  Admin: "bg-purple-100 text-purple-700 dark:bg-purple-700 dark:text-purple-100",
  Agent: "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100",
  Analyst: "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100",
  Viewer: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100",
};

const statusColors: Record<ClientUser["status"], string> = {
  Active: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
  Suspended: "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100",
  Pending: "bg-orange-100 text-orange-700 dark:bg-orange-700 dark:text-orange-100",
};

interface ClientUsersManagementProps {
  clientName: string;
  clientId: string;
}

export function ClientUsersManagement({ clientName, clientId }: ClientUsersManagementProps) {
  const { toast } = useToast();
  // In a real app, you'd fetch users for clientId
  const [users, setUsers] = React.useState<ClientUser[]>(mockClientUsers);

  const handleAddNewUser = () => {
    toast({ title: "Add New User Clicked", description: "Implement form to add new user for " + clientName });
    // Future: Open a form dialog
  };

  const handleUserAction = (action: string, userId: string, userName: string) => {
    toast({
      title: `Action: ${action}`,
      description: `Performed on ${userName} (ID: ${userId}) for client ${clientName}. (Simulated)`,
    });
    // Future: Implement actual API calls for these actions
    if (action === "Deactivate" || action === "Activate") {
        setUsers(prevUsers => prevUsers.map(user => 
            user.id === userId ? {...user, status: user.status === "Active" ? "Suspended" : "Active" } : user
        ));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        {/* Placeholder for filters if needed later */}
        <div></div>
        <Button onClick={handleAddNewUser}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New User
        </Button>
      </div>
      <ScrollArea className="flex-grow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.fullName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge className={`${roleColors[user.role]}`}>{user.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`${statusColors[user.status]}`}>{user.status}</Badge>
                </TableCell>
                <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}</TableCell>
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
                      <DropdownMenuItem onClick={() => handleUserAction("Edit", user.id, user.fullName)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUserAction("Reset Password", user.id, user.fullName)}>
                        <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user.status === "Active" ? (
                        <DropdownMenuItem className="text-yellow-600 focus:bg-yellow-50 focus:text-yellow-700" onClick={() => handleUserAction("Deactivate", user.id, user.fullName)}>
                          <UserX className="mr-2 h-4 w-4" /> Deactivate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem className="text-green-600 focus:bg-green-50 focus:text-green-700" onClick={() => handleUserAction("Activate", user.id, user.fullName)}>
                          <UserCheck className="mr-2 h-4 w-4" /> Activate
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleUserAction("Impersonate", user.id, user.fullName)}>
                        <UserCog className="mr-2 h-4 w-4" /> Impersonate (Admin)
                      </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => handleUserAction("View Permissions", user.id, user.fullName)}>
                        <ShieldQuestion className="mr-2 h-4 w-4" /> View Permissions
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {users.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No users found for this client.</p>
        )}
      </ScrollArea>
    </div>
  );
}

    