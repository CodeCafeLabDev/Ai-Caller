
'use server';

import { z } from 'zod';
// bcrypt and getDbConnection are no longer needed for API key-only auth
// import bcrypt from 'bcryptjs';
// import { getDbConnection } from '@/lib/db';
// import type { RowDataPacket } from 'mysql2';

// Define the expected API key
const VALID_API_KEY = "12345678910";
const API_USER_ROLE = "super_admin"; // Assuming this key grants super_admin
const API_USER_ID = "api_admin_user";

// Updated schema for API key input
const signInSchema = z.object({
  apiKey: z.string().min(1, { message: "API Key is required." }),
});

export async function signInUserAction(values: z.infer<typeof signInSchema>) {
  try {
    const validatedFields = signInSchema.safeParse(values);
    if (!validatedFields.success) {
      return { success: false, message: 'Invalid input.', user: null };
    }

    const { apiKey } = validatedFields.data;

    if (apiKey === VALID_API_KEY) {
      // API Key matches
      return {
        success: true,
        message: 'Sign in successful! (API Key Authenticated)',
        user: { userId: API_USER_ID, role: API_USER_ROLE },
      };
    } else {
      // API Key does not match
      return { success: false, message: 'Invalid API Key.', user: null };
    }

  } catch (error) {
    console.error('Sign in action error:', error);
    // Keep general error handling, though DB errors are less likely now for auth
    if (error instanceof Error && error.message.includes('connect ECONNREFUSED')) {
        return { success: false, message: 'Database connection failed (though not used for this auth type). Please ensure the database server is running and accessible for other app functions.', user: null };
    }
    return { success: false, message: 'An unexpected error occurred during sign in.', user: null };
  }
}
