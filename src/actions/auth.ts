
'use server';

import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient'; // Import Supabase client

// Define UserRole type - ensure this matches roles in your 'profiles' table
export type UserRole = 'super_admin' | 'client_admin' | 'user' | 'agent' | 'analyst' | 'viewer'; // Add any other roles you use

const signInSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

interface SignInResult {
  success: boolean;
  message: string;
  user: { userId: string; email: string; fullName: string | null; role: UserRole; } | null;
  error?: Error | null;
}

export async function signInUserAction(values: z.infer<typeof signInSchema>): Promise<SignInResult> {
  try {
    const validatedFields = signInSchema.safeParse(values);
    if (!validatedFields.success) {
      return { success: false, message: 'Invalid input.', user: null };
    }

    const { email, password } = validatedFields.data;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Supabase sign in error:', authError);
      return { success: false, message: authError.message || 'Sign in failed.', user: null, error: authError };
    }

    if (!authData.user) {
      return { success: false, message: 'User not found or credentials incorrect.', user: null };
    }

    // Attempt to fetch user role and full name from a 'profiles' table in Supabase
    // This table should have an 'id' column that is a foreign key to 'auth.users.id'
    // and a 'role' column (e.g., 'super_admin', 'client_admin', 'user')
    // and a 'full_name' column.
    let userRole: UserRole = 'user'; // Default role
    let userFullName: string | null = authData.user.user_metadata?.full_name || null;

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', authData.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116: no rows found (profile might not exist yet)
      console.warn(`Warning fetching user profile from Supabase for user ${authData.user.id}: ${profileError.message}. This might be okay if profile is created later or RLS prevents access.`);
      // Not a fatal error for login, but role might be default and full name might be missing.
      // Consider if a missing profile should prevent login or assign a default role.
    }

    if (profileData) {
      userRole = profileData.role as UserRole || userRole; // Cast to UserRole, provide fallback
      userFullName = profileData.full_name || userFullName;
    }
    
    // Fallback for full name if not in metadata or profiles
    if (!userFullName && authData.user.email) {
        userFullName = authData.user.email.split('@')[0]; 
    }


    // Authentication successful
    return {
      success: true,
      message: 'Sign in successful!',
      user: {
        userId: authData.user.id,
        email: authData.user.email!,
        fullName: userFullName,
        role: userRole,
      },
    };

  } catch (error) {
    console.error('Sign in action unexpected error:', error);
    let errorMessage = 'An unexpected error occurred during sign in.';
    if (error instanceof Error) {
      errorMessage = `Sign in failed: ${error.message}`;
    }
    return { success: false, message: errorMessage, user: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}
