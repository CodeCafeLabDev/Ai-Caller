
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
  ChevronsUpDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";

type UserRole = "Admin" | "Agent" | "Analyst" | "Viewer";
type UserStatus = "Active" | "Suspended" | "Pending";

type ClientUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: string;
  clientId?: string; 
};

const mockUsers: ClientUser[] = [
  { id: "usr_1", fullName: "Alice Johnson", email: "alice@example.com", phone: "555-0101", role: "Admin", status: "Active", lastLogin: "2024-07-20", clientId: "client_1" },
  { id: "usr_2", fullName: "Bob Williams", email: "bob@example.com", phone: "555-0102", role: "Agent", status: "Active", lastLogin: "2024-07-19", clientId: "client_1" },
  { id: "usr_3", fullName: "Charlie Brown", email: "charlie@example.com", phone: "555-0103", role: "Analyst", status: "Suspended", lastLogin: "2024-06-15", clientId: "client_2" },
  { id: "usr_4", fullName: "Diana Miller", email: "diana@example.com", phone: "555-0104", role: "Viewer", status: "Pending", clientId: "client_3" },
  { id: "usr_5", fullName: "Edward Davis", email: "edward@example.com", phone: "555-0105", role: "Agent", status: "Active", lastLogin: "2024-07-21", clientId: "client_2" },
];

const roleOptions: { value: UserRole | "all"; label: string }[] = [
  { value: "all", label: "All Roles" },
  { value: "Admin", label: "Admin" },
  { value: "Agent", label: "Agent" },
  { value: "Analyst", label: "Analyst" },
  { value: "Viewer", label: "Viewer" },
];
const statusOptions: UserStatus[] = ["Active", "Suspended", "Pending"];

const mockClientsForSelection = [
  { id: "client_1", name: "Innovate Corp" },
  { id: "client_2", name: "Solutions Ltd" },
  { id: "client_3", name: "Tech Ventures" },
  { id: "client_4", name: "Global Connect" },
  { id: "client_5", name: "Synergy Systems" },
];

const roleColors: Record<UserRole, string> = {
  Admin: "bg-purple-100 text-purple-700 dark:bg-purple-700 dark:text-purple-100",
  Agent: "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100",
  Analyst: "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100",
  Viewer: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100",
};

const statusColors: Record<UserStatus, string> = {
  Active: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
  Suspended: "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100",
  Pending: "bg-orange-100 text-orange-700 dark:bg-orange-700 dark:text-orange-100",
};

const addUserFormSchema = z.object({
  clientId: z.string({ required_error: "Please select a client." }),
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().optional(),
  role: z.enum(["Admin", "Agent", "Analyst", "Viewer"] as [UserRole, ...UserRole[]], { required_error: "Please select a role." }),
  status: z.enum(statusOptions, { required_error: "Please select a status." }),
});
type AddUserFormValues = z.infer<typeof addUserFormSchema>;

export default function ClientUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = React.useState<ClientUser[]>(mockUsers);
  const [roleFilter, setRoleFilter] = React.useState<UserRole | "all">("all");
  const [isAddUserSheetOpen, setIsAddUserSheetOpen] = React.useState(false);
  const [clientComboboxOpen, setClientComboboxOpen] = React.useState(false);
  const [roleFilterComboboxOpen, setRoleFilterComboboxOpen] = React.useState(false);


  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: {
      clientId: undefined,
      fullName: "",
      email: "",
      phone: "",
      role: undefined,
      status: "Active",
    },
  });

  const handleUserAction = (action: string, userId: string, userName: string) => {
    toast({
      title: `Action: ${action}`,
      description: `Performed on ${userName} (ID: ${userId}). (Simulated)`,
    });
    if (action === "Deactivate" || action === "Activate") {
        setUsers(prevUsers => prevUsers.map(user => 
            user.id === userId ? {...user, status: user.status === "Active" ? "Suspended" : "Active" } : user
        ));
    }
  };
  
  const onAddUserSubmit = (data: AddUserFormValues) => {
    console.log("New User Data:", data);
    const newUser: ClientUser = {
      id: `usr_${Date.now()}`,
      ...data,
      lastLogin: undefined, 
    };
    setUsers(prev => [newUser, ...prev]);
    toast({
      title: "User Added (Simulated)",
      description: `${data.fullName} for client ID ${data.clientId} has been added successfully.`,
    });
    form.reset();
    setIsAddUserSheetOpen(false);
  };

  const filteredUsers = users.filter(user => 
    roleFilter === "all" || user.role === roleFilter
  );

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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onAddUserSubmit)} className="flex flex-col h-full">
                <ScrollArea className="flex-grow">
                    <div className="space-y-4 py-4 px-2">
                        <FormField
                          control={form.control}
                          name="clientId"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Assign to Client</FormLabel>
                              <Popover open={clientComboboxOpen} onOpenChange={setClientComboboxOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      className={cn(
                                        "w-full justify-between",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value
                                        ? mockClientsForSelection.find(
                                            (client) => client.id === field.value
                                          )?.name
                                        : "Select a client"}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                  <Command>
                                    <CommandInput placeholder="Search client..." />
                                    <CommandList>
                                      <CommandEmpty>No client found.</CommandEmpty>
                                      <CommandGroup>
                                        {mockClientsForSelection.map((client) => (
                                          <CommandItem
                                            value={client.name}
                                            key={client.id}
                                            onSelect={() => {
                                              form.setValue("clientId", client.id);
                                              setClientComboboxOpen(false);
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                client.id === field.value
                                                  ? "opacity-100"
                                                  : "opacity-0"
                                              )}
                                            />
                                            {client.name}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="user@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Phone Number (Optional)</FormLabel>
                            <FormControl>
                                <Input type="tel" placeholder="555-123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {roleOptions.filter(r => r.value !== "all").map(role => (
                                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {statusOptions.map(status => (
                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                </ScrollArea>
                <SheetFooter className="pt-4 mt-auto border-t">
                  <SheetClose asChild>
                      <Button type="button" variant="outline">Cancel</Button>
                  </SheetClose>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Adding User..." : "Add User"}
                  </Button>
                </SheetFooter>
              </form>
            </Form>
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
              {roleOptions.find(r => r.value === roleFilter)?.label || "Filter by Role"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Search role..." />
              <CommandList>
                <CommandEmpty>No role found.</CommandEmpty>
                <CommandGroup>
                  {roleOptions.map(option => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        setRoleFilter(option.value as UserRole | "all");
                        setRoleFilterComboboxOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          roleFilter === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <ScrollArea className="rounded-lg border shadow-sm">
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
                <TableCell className="font-medium">{user.fullName}</TableCell>
                <TableCell>
                  <div>{user.email}</div>
                  {user.phone && <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3"/>{user.phone}</div>}
                </TableCell>
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
                        <UserCog className="mr-2 h-4 w-4" /> Impersonate
                      </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => handleUserAction("View Permissions", user.id, user.fullName)}>
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
      </ScrollArea>
       {filteredUsers.length > 10 && ( 
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      )}
    </div>
  );
}


    