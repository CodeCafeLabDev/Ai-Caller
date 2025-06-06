
'use server';

import { z } from 'zod';
// bcryptjs is no longer needed as we are not hashing/comparing passwords from a DB
// import bcrypt from 'bcryptjs';
// No need for Supabase or MySQL client here anymore

const signInSchema = z.object({
  userId: z.string().min(1, { message: "User ID is required." }), // Changed from email to userId
  password: z.string().min(1, { message: "Password is required." }),
});

interface SignInResult {
  success: boolean;
  message: string;
  user: { userId: string; email: string | undefined; fullName: string | null; role: string; } | null;
  error?: Error | null; // Generic error type
}

// Hardcoded mock users
const mockUsers = [
  {
    userId: 'admin',
    password: 'password123', // In a real app, never store plain text passwords
    fullName: 'Super Admin',
    role: 'super_admin',
    email: 'admin@example.com',
  },
  {
    userId: 'clientadmin',
    password: 'password123',
    fullName: 'Client Admin User',
    role: 'client_admin',
    email: 'clientadmin@example.com',
  },
];

export async function signInUserAction(values: z.infer<typeof signInSchema>): Promise<SignInResult> {
  try {
    const validatedFields = signInSchema.safeParse(values);
    if (!validatedFields.success) {
      return { success: false, message: 'Invalid input.', user: null };
    }

    const { userId, password } = validatedFields.data;

    const foundUser = mockUsers.find(u => u.userId === userId);

    if (!foundUser) {
      return { success: false, message: 'User ID not found.', user: null };
    }

    // Direct password comparison (NOT FOR PRODUCTION if passwords were hashed)
    if (foundUser.password !== password) {
      return { success: false, message: 'Incorrect password.', user: null };
    }

    // Authentication successful
    return {
      success: true,
      message: 'Sign in successful!',
      user: { 
        userId: foundUser.userId, 
        email: foundUser.email, 
        fullName: foundUser.fullName, 
        role: foundUser.role 
      },
    };

  } catch (error) {
    console.error('Sign in action unexpected error:', error);
    let errorMessage = 'An unexpected error occurred during sign in.';
    if (error instanceof Error) {
        errorMessage = `Sign in failed: ${error.message}`;
    }
    return { success: false, message: errorMessage, user: null, error };
  }
}
