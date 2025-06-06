
'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getDbConnection, closeDbConnection } from '@/lib/db'; // Assuming db utilities are in lib/db

const signInSchema = z.object({
  userId: z.string().min(1, { message: "User ID is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

interface SignInResult {
  success: boolean;
  message: string;
  user: { userId: string; email: string | undefined; fullName: string | null; role: string; } | null;
  error?: Error | null;
}

export async function signInUserAction(values: z.infer<typeof signInSchema>): Promise<SignInResult> {
  let connection;
  try {
    const validatedFields = signInSchema.safeParse(values);
    if (!validatedFields.success) {
      return { success: false, message: 'Invalid input.', user: null };
    }

    const { userId, password } = validatedFields.data;

    connection = await getDbConnection();

    const [rows] = await connection.execute(
      'SELECT * FROM Users WHERE user_identifier = ?',
      [userId]
    );

    const users = rows as any[];
    if (users.length === 0) {
      return { success: false, message: 'User ID not found.', user: null };
    }

    const userFromDb = users[0];

    const passwordMatch = await bcrypt.compare(password, userFromDb.password_hash);
    if (!passwordMatch) {
      return { success: false, message: 'Incorrect password.', user: null };
    }

    // Authentication successful
    return {
      success: true,
      message: 'Sign in successful!',
      user: {
        userId: userFromDb.user_identifier,
        email: userFromDb.email,
        fullName: userFromDb.full_name,
        role: userFromDb.role,
      },
    };

  } catch (error) {
    console.error('Sign in action error:', error);
    let errorMessage = 'An unexpected error occurred during sign in.';
    if (error instanceof Error) {
      // Check for specific MySQL connection errors
      if ((error as any).code === 'ECONNREFUSED' || (error as any).code === 'ER_ACCESS_DENIED_ERROR') {
        errorMessage = `Database connection error: ${error.message}. Please check DB credentials and accessibility.`;
      } else {
        errorMessage = `Sign in failed: ${error.message}`;
      }
    }
    return { success: false, message: errorMessage, user: null, error: error instanceof Error ? error : new Error(String(error)) };
  } finally {
    if (connection) {
      await closeDbConnection(connection);
    }
  }
}
