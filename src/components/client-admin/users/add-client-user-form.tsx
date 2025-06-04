
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
import { useToast } from "@/hooks/use-toast";

// Define roles and statuses specific to client users
const clientUserRoles = ["Admin", "Agent", "Analyst", "Viewer"] as const;
export type ClientUserRole = typeof clientUserRoles[number]; // Exporting for use in users/page.tsx type

const clientUserStatuses = ["Active", "Pending"] as const; // Suspended is usually an action, not initial state
export type ClientUserStatus = typeof clientUserStatuses[number]; // Exporting for use in users/page.tsx type

const addClientUserFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().optional(),
  role: z.enum(clientUserRoles, { required_error: "Please select a role." }),
  status: z.enum(clientUserStatuses, { required_error: "Please select a status." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type AddClientUserFormValues = z.infer<typeof addClientUserFormSchema>;

interface AddClientUserFormProps {
  onSuccess: (data: AddClientUserFormValues) => void;
  onCancel: () => void;
}

export function AddClientUserForm({ onSuccess, onCancel }: AddClientUserFormProps) {
  const { toast } = useToast();
  const form = useForm<AddClientUserFormValues>({
    resolver: zodResolver(addClientUserFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      role: undefined,
      status: "Active", // Default to Active
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(data: AddClientUserFormValues) {
    // In a real app, this would call an API to create the user.
    console.log("New Client User Data (Simulated):", data);
    // Removed direct toast from here, will be handled by parent page
    form.reset(); // Reset form fields
    onSuccess(data); // Call parent's success handler
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-4 px-2 py-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Smith" {...field} className="h-9 text-sm" />
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
                  <FormLabel>Email Address*</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="user@clientcompany.com" {...field} className="h-9 text-sm" />
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
                    <Input type="tel" placeholder="555-123-4567" {...field} className="h-9 text-sm" />
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
                  <FormLabel>Role*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select user's role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clientUserRoles.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
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
                  <FormLabel>Initial Status*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select initial status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clientUserStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Password*</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password*</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-xs text-muted-foreground pt-2">* Required fields</p>
          </div>
        </ScrollArea>
        <SheetFooter className="pt-4 px-2 mt-auto border-t">
            <SheetClose asChild>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            </SheetClose>
            <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Adding User..." : "Add User"}
            </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}
