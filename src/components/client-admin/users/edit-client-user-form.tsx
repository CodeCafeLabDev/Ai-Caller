"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetFooter, SheetClose } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";

// Define roles and statuses specific to client users
const clientUserStatuses = ["Active", "Suspended", "Pending"] as const;
export type ClientUserStatus = typeof clientUserStatuses[number];

// In the zod schema, role is now a string (role_id)
const editClientUserFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().optional(),
  role: z.string().min(1, { message: "Please select a role." }), // role_id as string
  status: z.enum(clientUserStatuses, { required_error: "Please select a status." }),
});

export type EditClientUserFormValues = z.infer<typeof editClientUserFormSchema>;

interface EditClientUserFormProps {
  user: {
    id: string;
    full_name?: string;
    name?: string;
    email: string;
    phone?: string;
    role_id?: number;
    role_name?: string;
    status: string;
  };
  userRoles: { id: number; role_name: string; description: string; permissions_summary: string; status: string }[];
  onSuccess: (data: EditClientUserFormValues) => void;
  onCancel: () => void;
}

export function EditClientUserForm({ user, userRoles, onSuccess, onCancel }: EditClientUserFormProps) {
  const { toast } = useToast();

  const form = useForm<EditClientUserFormValues>({
    resolver: zodResolver(editClientUserFormSchema),
    defaultValues: {
      fullName: user.full_name || user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role_id ? user.role_id.toString() : "",
      status: user.status as ClientUserStatus,
    },
  });

  const onSubmit = (data: EditClientUserFormValues) => {
    try {
      onSuccess(data);
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating the user.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email address" {...field} />
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
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
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
                      {userRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.role_name}
                        </SelectItem>
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
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clientUserStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </ScrollArea>

      <SheetFooter className="flex gap-2 pt-4">
        <SheetClose asChild>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </SheetClose>
        <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
          Update User
        </Button>
      </SheetFooter>
    </div>
  );
}
