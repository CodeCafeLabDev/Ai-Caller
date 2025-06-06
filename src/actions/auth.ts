
'use server';

import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import type { AuthError, User } from '@supabase/supabase-js';

const signInSchema = z.object({
  email: z.string().email({ message: "Valid email is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

interface SignInResult {
  success: boolean;
  message: string;
  user: { userId: string; email: string | undefined; fullName: string | null; role: string; } | null;
  error?: AuthError | null;
}

interface SupabaseProfile {
  id: string;
  full_name: string | null;
  role: string;
  // Add other profile fields if necessary
}

export async function signInUserAction(values: z.infer<typeof signInSchema>): Promise<SignInResult> {
  try {
    const validatedFields = signInSchema.safeParse(values);
    if (!validatedFields.success) {
      return { success: false, message: 'Invalid input.', user: null };
    }

    const { email, password } = validatedFields.data;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return { success: false, message: authError.message || 'Authentication failed.', user: null, error: authError };
    }

    if (!authData.user) {
      return { success: false, message: 'Authentication failed. User not found.', user: null };
    }

    // Fetch user profile to get the role
    // This assumes you have a 'profiles' table with 'id' (matching auth.users.id) and 'role' columns.
    let userRole = 'user'; // Default role
    let fullName = authData.user.user_metadata?.full_name || null;

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', authData.user.id)
      .single<SupabaseProfile>();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116: 0 rows
      console.warn('Error fetching user profile for role:', profileError.message);
      // Proceed with default role if profile fetching fails but auth succeeded
    }

    if (profileData) {
      userRole = profileData.role || 'user';
      fullName = profileData.full_name || fullName;
    } else {
        console.warn(`No profile found for user ${authData.user.id}. Defaulting to role 'user'. Consider creating a profile entry.`);
    }
    

    return {
      success: true,
      message: 'Sign in successful!',
      user: { userId: authData.user.id, email: authData.user.email, fullName: fullName, role: userRole },
    };

  } catch (error) {
    console.error('Sign in action unexpected error:', error);
    let errorMessage = 'An unexpected error occurred during sign in.';
    if (error instanceof Error) {
        errorMessage = `Sign in failed: ${error.message}`;
    }
    return { success: false, message: errorMessage, user: null };
  }
}
