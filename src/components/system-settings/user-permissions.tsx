"use client";

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const UserPermissions = () => {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('');
  const [newUserEmailError, setNewUserEmailError] = useState('');
  const [newUserRoleError, setNewUserRoleError] = useState('');

  // Placeholder for existing users data (replace with data from your backend)
  const [users, setUsers] = useState([
    { id: 'user1', email: 'user1@example.com', role: 'Admin' },
    { id: 'user2', email: 'user2@example.com', role: 'Editor' },
    { id: 'user3', email: 'user3@example.com', role: 'Viewer' },
  ]);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<typeof users[0] | null>(null);
  const [editingUserRole, setEditingUserRole] = useState('');
  const [editingUserRoleError, setEditingUserRoleError] = useState('');


  const { toast } = useToast();

  const handleInviteUser = () => {
    // Basic validation
    let hasError = false;
    if (!newUserEmail || !newUserEmail.includes('@')) {
      setNewUserEmailError('Please enter a valid email address.');
      hasError = true;
    } else {
      setNewUserEmailError('');
    }
    if (!newUserRole) {
      setNewUserRoleError('Please select a role.');
      hasError = true;
    } else {
      setNewUserRoleError('');
    }

    if (hasError) {
      return;
    }

    // Handle inviting a new user
    console.log('Inviting user:', newUserEmail, newUserRole);
    // Implement logic to send invitation (e.g., API call)
    // On success:
    toast({
      title: "Invitation Sent",
      description: `An invitation has been sent to ${newUserEmail} with role ${newUserRole}.`,
    });
    // Clear input fields after inviting
    setNewUserEmail('');
    setNewUserRole('');
    // On error:
    // toast({
    //   title: "Error",
    //   description: "Failed to send invitation.",
    //   variant: "destructive",
    // });
  };

  const handleRemoveUser = (userId: string) => {
    // Handle removing an existing user
    console.log('Removing user:', userId);
    // Implement logic to remove user (e.g., API call)
    // On success:
    setUsers(users.filter(user => user.id !== userId));
    toast({
      title: "User Removed",
      description: "The user has been successfully removed.",
    });
    // On error:
    // toast({
    //   title: "Error",
    //   description: "Failed to remove user.",
    //   variant: "destructive",
    // });
  };

  const handleEditUser = (user: typeof users[0]) => {
    setEditingUser(user);
    setEditingUserRole(user.role); // Initialize role in the modal
    setEditingUserRoleError(''); // Clear previous errors
    setIsEditDialogOpen(true);
  };

  const handleSaveEditedUser = () => {
     // Basic validation for edit modal
    if (!editingUserRole) {
      setEditingUserRoleError('Please select a role.');
      return;
    }
    setEditingUserRoleError('');

    if (!editingUser) return;

    // Handle saving the edited role
    console.log('Saving edited role for', editingUser.id, editingUserRole);
    // Implement API call to update user role
    // On success:
    setUsers(users.map(user => user.id === editingUser.id ? { ...user, role: editingUserRole } : user));
    setIsEditDialogOpen(false);
    toast({
      title: "User Updated",
      description: `The role for ${editingUser.email} has been updated to ${editingUserRole}.`,
    });
    // On error:
    // toast({
    //   title: "Error",
    //   description: "Failed to update user role.",
    //   variant: "destructive",
    // });
  };


  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">User & Permissions Management</h2>
      <p className="text-muted-foreground">Manage user accounts, roles, and permissions.</p>

      {/* Invite New User Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Invite New User</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="newUserEmail">Email Address</Label>
            <Input
              id="newUserEmail"
              type="email"
              value={newUserEmail}
              onChange={(e) => {
                setNewUserEmail(e.target.value);
                setNewUserEmailError('');
              }}
              placeholder="Enter email address"
              className={newUserEmailError ? 'border-destructive' : ''}
            />
            {newUserEmailError && <p className="text-destructive text-sm">{newUserEmailError}</p>}
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="newUserRole">Role</Label>
            <Select onValueChange={setNewUserRole} value={newUserRole}>
              <SelectTrigger id="newUserRole" className={newUserRoleError ? 'border-destructive' : ''}>
                <div className="text-muted-foreground">{newUserRole || "Select a role"}</div>
              </SelectTrigger>
              <SelectContent>
                {/* Replace with your actual available roles */}
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            {newUserRoleError && <p className="text-destructive text-sm">{newUserRoleError}</p>}
          </div>
          <div className="flex items-end">
            <Button onClick={handleInviteUser}>Invite User</Button>
          </div>
        </div>
      </div>

      {/* Existing Users Table */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Existing Users</h3>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditUser(user)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleRemoveUser(user.id)}>Remove</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* Add pagination controls here if needed */}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Edit the role for {editingUser.email}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="editUserRole">Role</Label>
                 <Select onValueChange={setEditingUserRole} value={editingUserRole}>
                  <SelectTrigger id="editUserRole" className={editingUserRoleError ? 'border-destructive' : ''}>
                    <div className="text-muted-foreground">{editingUserRole || "Select a role"}</div>
                  </SelectTrigger>
                  <SelectContent>
                    {/* Replace with your actual available roles */}
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                {editingUserRoleError && <p className="text-destructive text-sm">{editingUserRoleError}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEditedUser}>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UserPermissions;
