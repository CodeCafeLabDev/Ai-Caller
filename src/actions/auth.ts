
'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getDbConnection } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

// Schema for User ID and Password
const signInSchema = z.object({
  user_Id: z.string().min(1, { message: "User ID is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

interface UserFromDb extends RowDataPacket {
  id: number;
  user_identifier: string;
  password_hash: string;
  full_name: string | null;
  email: string | null;
  role?: string; // Role will be fetched or inferred
}

export async function signInUserAction(values: z.infer<typeof signInSchema>) {
  try {
    const validatedFields = signInSchema.safeParse(values);
    if (!validatedFields.success) {
      return { success: false, message: 'Invalid input.', user: null };
    }

    const { user_Id, password } = validatedFields.data;
    let conn;

    try {
      conn = await getDbConnection();
      const [rows] = await conn.execute<UserFromDb[]>(
        'SELECT * FROM Users WHERE user_identifier = ?',
        [user_Id]
      );

      if (rows.length === 0) {
        return { success: false, message: 'Invalid User ID or Password.', user: null };
      }

      const user = rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        return { success: false, message: 'Invalid User ID or Password.', user: null };
      }

      // Infer role for specific test users - in a real scenario, fetch role from DB
      let role = user.role || 'user'; // Default role if not specified
      if (user.user_identifier === 'testUser') {
        role = 'super_admin';
      } else if (user.user_identifier === 'clientTestUser' || user.user_identifier === 'dineshUser') {
        role = 'client_admin';
      }
      // For a more robust system, you'd fetch roles from the UserRoles table based on user.id

      return {
        success: true,
        message: 'Sign in successful!',
        user: { userId: user.user_identifier, email: user.email, fullName: user.full_name, role: role },
      };

    } catch (dbError) {
      console.error('Database error during sign in:', dbError);
      if (dbError instanceof Error && dbError.message.includes('connect ECONNREFUSED')) {
          return { success: false, message: 'Database connection failed. Please ensure the database server is running and accessible.', user: null };
      }
      return { success: false, message: 'An error occurred while trying to sign in.', user: null };
    }

  } catch (error) {
    console.error('Sign in action error:', error);
    return { success: false, message: 'An unexpected error occurred during sign in.', user: null };
  }
}
