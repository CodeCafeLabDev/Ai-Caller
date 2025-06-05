
'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getDbConnection } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

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

    const { user_Id, password: inputPassword } = validatedFields.data;

    const db = await getDbConnection();
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT password FROM Login WHERE user_Id = ?',
      [user_Id]
    );

    if (rows.length === 0) {
      return { success: false, message: 'Invalid User ID or password.', user: null };
    }

    const userFromDb = rows[0];
    const storedPasswordHash = userFromDb.password;

    const passwordMatches = await bcrypt.compare(inputPassword, storedPasswordHash);

    if (!passwordMatches) {
      return { success: false, message: 'Invalid User ID or password.', user: null };
    }

    // Role determination (current limitation: based on known test user_Ids)
    let userRole: string | null = null;
    let successMessage: string = 'Sign in successful!';

    if (user_Id === 'testUser') {
      userRole = 'super_admin';
      successMessage = 'Sign in successful! (Super Admin)';
    } else if (user_Id === 'clientTestUser') {
      userRole = 'client_admin';
      successMessage = 'Sign in successful! (Client Admin)';
    } else {
      // For other DB users, role cannot be determined from Login table alone
      // This indicates a need for DB schema enhancement for roles.
      return { 
        success: false, 
        message: 'User authenticated, but role determination is not configured for this user.', 
        user: null 
      };
    }

    return {
      success: true,
      message: successMessage,
      user: { userId: user_Id, role: userRole },
    };

  } catch (error) {
    console.error('Sign in action error:', error);
    // Check for specific MySQL errors if needed, e.g., connection errors
    if (error instanceof Error && error.message.includes('connect ECONNREFUSED')) {
        return { success: false, message: 'Database connection failed. Please ensure the database server is running and accessible.', user: null };
    }
    return { success: false, message: 'An unexpected error occurred during sign in.', user: null };
  }
}
