
'use server';

import { z } from 'zod';
// Removed: import bcrypt from 'bcryptjs';
// Removed: import { getDbConnection } from '@/lib/db';
// Removed: import type { RowDataPacket } from 'mysql2';

const signInSchema = z.object({
  user_Id: z.string().min(1, { message: "User ID is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export async function signInUserAction(values: z.infer<typeof signInSchema>) {
  try {
    const validatedFields = signInSchema.safeParse(values);
    if (!validatedFields.success) {
      return { success: false, message: 'Invalid input.', user: null };
    }

    const { user_Id, password } = validatedFields.data;

    // Hardcoded credentials for testing
    if (user_Id === 'testUser' && password === 'password123') {
      return {
        success: true,
        message: 'Sign in successful! (Super Admin)',
        user: { userId: 'testUser', role: 'super_admin' },
      };
    } else if (user_Id === 'clientTestUser' && password === 'password123') {
      return {
        success: true,
        message: 'Sign in successful! (Client Admin)',
        user: { userId: 'clientTestUser', role: 'client_admin' },
      };
    } else {
      return { success: false, message: 'Invalid User ID or password.', user: null };
    }

  } catch (error) {
    console.error('Sign in action error (simplified):', error);
    return { success: false, message: 'An unexpected error occurred.', user: null };
  }
}
