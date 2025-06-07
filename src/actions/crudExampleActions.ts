
'use server';

import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Schema for adding an item
const addItemSchema = z.object({
  name: z.string().min(1, { message: "Item name cannot be empty." }),
});

export interface Item {
  id: number;
  name: string | null;
  user_id: string | null;
  created_at: string;
}

export interface CrudResult {
  success: boolean;
  message: string;
  data?: Item[] | Item | null;
  error?: any;
}

// Get all items
export async function getItemsAction(): Promise<CrudResult> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching items:', error);
    return { success: false, message: 'Failed to fetch items.', error };
  }
  return { success: true, message: 'Items fetched successfully.', data };
}

// Add a new item
export async function addItemAction(formData: FormData): Promise<CrudResult> {
  const name = formData.get('name') as string;

  const validatedFields = addItemSchema.safeParse({ name });
  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Validation failed: ' + validatedFields.error.flatten().fieldErrors.name?.join(', '),
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  // user_id will be automatically set by Supabase if using RLS with `DEFAULT auth.uid()`
  // and the user is authenticated.
  const { data: authData, error: authUserError } = await supabase.auth.getUser();
  if (authUserError || !authData.user) {
     console.error('User not authenticated for addItemAction:', authUserError);
     return { success: false, message: 'You must be logged in to add items.', error: authUserError };
  }

  const { data, error } = await supabase
    .from('items')
    .insert([{ name: validatedFields.data.name, user_id: authData.user.id }]) // Explicitly set user_id
    .select()
    .single();

  if (error) {
    console.error('Error adding item:', error);
    return { success: false, message: 'Failed to add item. ' + error.message, error };
  }

  revalidatePath('/supabase-crud-example'); // Revalidate the page to show the new item
  return { success: true, message: 'Item added successfully!', data };
}

// Delete an item
export async function deleteItemAction(itemId: number): Promise<CrudResult> {
  if (!itemId) {
    return { success: false, message: 'Item ID is required for deletion.' };
  }

  const { error } = await supabase
    .from('items')
    .delete()
    .match({ id: itemId });

  if (error) {
    console.error('Error deleting item:', error);
    // Check for RLS violation specifically
    if (error.message.includes('violates row-level security policy')) {
        return { success: false, message: 'Failed to delete item. You may not have permission to delete this item.', error };
    }
    return { success: false, message: 'Failed to delete item. ' + error.message, error };
  }

  revalidatePath('/supabase-crud-example'); // Revalidate the page
  return { success: true, message: 'Item deleted successfully!' };
}
