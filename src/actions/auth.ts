
'use server';

import type { RowDataPacket } from 'mysql2';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getDbConnection, closeDbConnection } from '@/lib/db';
import type mysql from 'mysql2/promise';

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
  role: string; 
}

export async function signInUserAction(values: z.infer<typeof signInSchema>) {
  let conn: mysql.Connection | null = null;
  try {
    const validatedFields = signInSchema.safeParse(values);
    if (!validatedFields.success) {
      return { success: false, message: 'Invalid input.', user: null };
    }

    const { user_Id, password } = validatedFields.data;

    conn = await getDbConnection();
    const [rows] = await conn.execute<UserFromDb[]>(
      'SELECT id, user_identifier, password_hash, full_name, email, role FROM Users WHERE user_identifier = ?',
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
    
    // Use the role directly from the database
    const userRole = user.role || 'user'; // Fallback to 'user' if role is somehow null/empty

    return {
      success: true,
      message: 'Sign in successful!',
      user: { userId: user.user_identifier, email: user.email, fullName: user.full_name, role: userRole },
    };

  } catch (error) {
    console.error('Sign in action error:', error);
    let errorMessage = 'An unexpected error occurred during sign in.';
    if (error instanceof Error) {
        if (error.message.includes('connect ECONNREFUSED')) {
             errorMessage = 'Database connection failed. Please ensure the database server is running and accessible.';
        } else {
            errorMessage = `Sign in failed: ${error.message}`;
        }
    }
    return { success: false, message: errorMessage, user: null };
  } finally {
    if (conn) {
      await closeDbConnection(conn);
    }
  }
}
