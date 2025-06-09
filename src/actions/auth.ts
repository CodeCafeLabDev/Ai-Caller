
'use server';

import { z } from 'zod';

// Define UserRole type - ensure this matches roles used in your application
export type UserRole = 'super_admin' | 'client_admin' | 'user' | 'agent' | 'analyst' | 'viewer';

const signInSchema = z.object({
  // For this temporary bypass, we'll still use 'email' as the field name,
  // but the user can enter any non-empty string.
  email: z.string().min(1, { message: "User ID (any text) is required." }),
  password: z.string().min(1, { message: "Password (any text) is required." }),
});

interface SignInResult {
  success: boolean;
  message: string;
  user: { userId: string; email: string; fullName: string | null; role: UserRole; } | null;
  error?: Error | null;
}

export async function signInUserAction(values: z.infer<typeof signInSchema>): Promise<SignInResult> {
  console.log("Attempting TEMPORARY BYPASS sign-in with values:", values);

  const validatedFields = signInSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: 'Invalid input.', user: null };
  }

  const { email, password } = validatedFields.data;

  // --- Temporary Bypass Logic ---
  if (email.trim() !== "" && password.trim() !== "") {
    console.log("Temporary bypass: Credentials provided. Simulating successful login.");
    
    let userRole: UserRole = 'super_admin';
    let userFullName = 'Test Bypass Super Admin';
    
    if (email.toLowerCase().includes('clientadmin')) {
      userRole = 'client_admin';
      userFullName = 'Test Bypass Client Admin';
      console.log("Bypass: Detected 'clientadmin' in User ID. Assigning client_admin role.");
    }

    return {
      success: true,
      message: 'Sign in successful (Bypass Mode)!',
      user: {
        userId: `test_user_bypass_${userRole}`,
        email: email, // Use the entered value as email for consistency
        fullName: userFullName,
        role: userRole, 
      },
    };
  } else {
    // This case should ideally be caught by the Zod schema, but as a fallback.
    return { success: false, message: 'User ID and Password cannot be empty.', user: null };
  }
  // --- End of Temporary Bypass Logic ---
}
