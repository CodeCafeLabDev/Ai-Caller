
'use server';
/**
 * @fileOverview Development-time script for Supabase setup.
 * This script handles:
 * 1. Instructing the user to create a 'profiles' table.
 * 2. Attempting to sign up test users (superadmin, clientadmin).
 * 3. Attempting to seed the 'profiles' table for these test users.
 *
 * Run this script using `npm run genkit:dev` or `npm run genkit:watch`.
 */
import { supabase } from '@/lib/supabaseClient';
import type { UserRole } from '@/actions/auth'; // Assuming UserRole is exported

const PROFILES_TABLE_SQL = `
-- Ensure you run this SQL in your Supabase SQL Editor ONE TIME to create the 'profiles' table.
-- This table stores additional user information linked to Supabase Auth users.

-- 1. Create the 'profiles' table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text UNIQUE, -- Can be useful for lookups, ensure it's populated correctly
  role text DEFAULT 'user'::text, -- Default role for new profiles
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Enable Row Level Security (RLS) on the profiles table
-- IMPORTANT: Always enable RLS for tables containing user data.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for 'profiles' table:
--    Adjust these policies based on your application's specific requirements.

-- Policy: Allow users to view their own profile.
CREATE POLICY "Users can view their own profile."
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Allow users to update their own profile.
CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Allow service_role (e.g., server-side actions using service key) to manage all profiles.
-- THIS IS IMPORTANT FOR THE AUTH ACTION TO READ ROLES IF USING SERVICE KEY,
-- OR FOR ADMINS TO MANAGE PROFILES.
-- If your auth.ts uses the anon key for profile fetching, the authenticated user needs SELECT on their own profile (covered above).
-- If an admin needs to manage roles, they would need broader permissions or use a service_role key.
CREATE POLICY "Admins (service_role) can manage all profiles"
  ON public.profiles FOR ALL
  TO service_role -- Or a specific admin role if you have one
  USING (true)
  WITH CHECK (true);

-- Optional: If you want new users from Supabase Auth to automatically get a profile entry
-- you can create a trigger. This is more advanced but very useful.
-- Example Trigger Function:
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS trigger
-- LANGUAGE plpgsql
-- SECURITY DEFINER SET search_path = public
-- AS $$
-- BEGIN
--   INSERT INTO public.profiles (id, email, full_name, role)
--   VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', new.email), COALESCE(new.raw_user_meta_data->>'role', 'user')::text);
--   RETURN new;
-- END;
-- $$;

-- Example Trigger:
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- COMMENT ON TRIGGER on_auth_user_created ON auth.users
--   IS 'When a new user signs up, creates a corresponding record in public.profiles.';
`;


interface TestUser {
  email: string;
  password?: string; // Optional, as Supabase might handle this if user exists
  fullName: string;
  role: UserRole; // Ensure UserRole type is correctly defined and imported
}

// Define test users to be created/updated
const testUsers: TestUser[] = [
  { email: 'superadmin@example.com', password: 'password123', fullName: 'Super Admin User', role: 'super_admin' },
  { email: 'clientadmin@example.com', password: 'password123', fullName: 'Client Admin User', role: 'client_admin' },
  { email: 'testuser@example.com', password: 'password123', fullName: 'Regular Test User', role: 'user' },
];

async function seedUser(user: TestUser) {
  console.log(`\n--- Processing user: ${user.email} ---`);

  // 1. Attempt to sign up the user (creates an entry in auth.users)
  //    If the user already exists, signUp will error, which is fine for this seeding script.
  let authUserId: string | undefined;
  let authUserEmail: string | undefined;

  if (user.password) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          full_name: user.fullName, // Optional: pass metadata during signup
          // role: user.role, // Passing role via options.data might be possible if your trigger handles it
        }
      }
    });

    if (signUpError && signUpError.message.includes('User already registered')) {
      console.log(`User ${user.email} already exists in Supabase Auth. Fetching details...`);
      // If user exists, we need their ID to link to the profiles table.
      // This requires admin privileges or the user to be logged in to get their own ID.
      // For a seeding script, using service_role key temporarily or manual lookup might be needed
      // if you don't want to log them in.
      // For simplicity, we'll try to fetch by email if service_role is available or using admin client.
      // This demo assumes we might not have an active session for these users yet.
      // A robust seeding script might use a service_role key for this part.
      // As an alternative, we can try to sign in the user to get their ID if they exist.
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: user.password,
      });
      if (signInError) {
          console.error(`Could not sign in existing user ${user.email} to get ID:`, signInError.message);
      } else if (signInData.user) {
          authUserId = signInData.user.id;
          authUserEmail = signInData.user.email;
          console.log(`Signed in existing user ${user.email} to get ID: ${authUserId}`);
          await supabase.auth.signOut(); // Sign out immediately after getting ID
      }

    } else if (signUpError) {
      console.error(`Error signing up ${user.email}:`, signUpError.message);
      // If sign up fails for other reasons, we might not be able to proceed for this user.
      return;
    } else if (signUpData.user) {
      authUserId = signUpData.user.id;
      authUserEmail = signUpData.user.email;
      console.log(`Successfully signed up ${user.email}. User ID: ${authUserId}`);
      // IMPORTANT: Supabase might send a confirmation email. For testing,
      // you might want to auto-confirm users in your Supabase project settings or via admin API.
    }
  } else {
     console.log(`Password not provided for ${user.email}, assuming user exists or will be created manually in Auth console.`);
     // Attempt to fetch user by email (requires appropriate RLS or service_role)
     // This part is tricky with only anon key if RLS restricts access to auth.users.
     // For now, we'll assume if no password, you handle auth.users creation manually.
     // To reliably get an existing user's ID without signing them in, you'd typically use a service_role client.
     // We'll proceed hoping the profiles table has a unique constraint on email for an upsert.
     authUserEmail = user.email; // We'll use email for upsert matching
  }


  if (!authUserId && !authUserEmail) {
    console.warn(`Could not determine Auth User ID or Email for ${user.fullName}. Skipping profile creation.`);
    return;
  }

  // 2. Insert or update the user's profile in the 'profiles' table
  //    This uses the standard Supabase client with your anon key and respects RLS.
  //    The `id` must match the `id` from `auth.users`.
  //    Using `upsert` is good for seeding scripts.
  const profileData = {
    id: authUserId, // This might be undefined if user already existed and we couldn't fetch ID
    email: authUserEmail, // Use email for matching if ID is not available
    full_name: user.fullName,
    role: user.role,
  };

  // If authUserId is available, use it for upsert. Otherwise, try to match on email.
  // Note: Upserting on email requires 'email' to be a unique constraint in 'profiles'.
  const upsertOptions = authUserId ? { onConflict: 'id' } : { onConflict: 'email', ignoreDuplicates: false };
  const profileToInsert = authUserId ? profileData : { email: authUserEmail, full_name: user.fullName, role: user.role };


  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert(profileToInsert, upsertOptions) // Upsert based on 'id' or 'email'
    .select()
    .single();

  if (profileError) {
    console.error(`Error seeding profile for ${user.email}:`, profileError.message);
    if (profileError.message.includes('violates foreign key constraint')) {
        console.error(`  HINT: This often means the user with ID '${authUserId}' or email '${authUserEmail}' does not exist in 'auth.users' table, or the 'profiles' table RLS is preventing the insert/update.`);
    } else if (profileError.message.includes('duplicate key value violates unique constraint "profiles_email_key"')) {
        console.error(`  HINT: A profile with email '${authUserEmail}' already exists. The upsert on 'email' might need adjustment or ensure 'id' is correctly passed if the auth user exists.`);
    }
  } else if (profile) {
    console.log(`Successfully seeded profile for ${user.email} (Role: ${profile.role}, Full Name: ${profile.full_name}).`);
    if (user.password) {
      console.log(`  Login with Email: ${user.email}, Password: ${user.password}`);
    } else {
      console.log(`  Login with Email: ${user.email} (Password managed via Supabase console).`);
    }
  }
}

async function main() {
  console.log("==========================================================================");
  console.log(" MIGRATING TO SUPABASE AUTH & POSTGRES (via supabase-js client) ");
  console.log("==========================================================================");
  console.log("ENSURE YOUR `.env.local` FILE HAS `NEXT_PUBLIC_SUPABASE_URL` AND `NEXT_PUBLIC_SUPABASE_ANON_KEY` SET.");
  console.log("\n--- IMPORTANT: Supabase 'profiles' Table Setup ---");
  console.log("You need to create a 'profiles' table in your Supabase database to store roles and other user metadata.");
  console.log("If you haven't done so, please run the following SQL in your Supabase SQL Editor (Supabase Dashboard -> SQL Editor -> New query):");
  console.log("--------------------------------------------------------------------------");
  console.log(PROFILES_TABLE_SQL);
  console.log("--------------------------------------------------------------------------");
  console.log("The RLS policies in the SQL above are examples. Adjust them to your app's needs.");
  console.log("Especially review policies if you want to allow users to update their own roles or if admins manage roles.");
  console.log("For this seeding script to work best, ensure your 'profiles' table allows inserts from authenticated users or has permissive RLS for seeding, or use a service_role key for seeding in production.");

  console.log("\n--- Attempting to Seed Test Users and Profiles ---");
  console.log("This script will try to sign up test users and add their profiles.");
  console.log("If users already exist in Supabase Auth, sign-up will be skipped, and it will attempt to create/update their profile.");
  console.log("Check your Supabase console (Authentication & Database->profiles table) to verify.");
  console.log("For new users, Supabase might send confirmation emails. Configure auto-confirmation in Supabase settings for easier testing if needed.");

  for (const user of testUsers) {
    await seedUser(user);
  }

  console.log("\n--- Supabase User and Profile Seeding Attempt Complete ---");
  console.log("Review the logs above for success or errors for each user.");
  console.log("You should now be able to log in with the test user credentials if successfully seeded.");
  console.log("==========================================================================");
}

main().catch(error => {
  console.error("\nFATAL: Supabase dev script FAILED:", error);
  console.error("Check connection to Supabase, .env.local variables, and if the 'profiles' table SQL has been run.");
});
