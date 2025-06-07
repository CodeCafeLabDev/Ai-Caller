
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
-- LOGIN TO YOUR SUPABASE DASHBOARD AND RUN THIS IN THE "SQL Editor".

-- If you encounter "ERROR: 42501: must be owner of relation users" when running the CREATE TABLE below:
-- 1. Ensure you are running this SQL as the 'postgres' user (default in Supabase SQL Editor).
-- 2. Try creating the table via the Supabase Dashboard UI (Table Editor):
--    - Create a table named 'profiles' in the 'public' schema.
--    - Add an 'id' column of type 'uuid', make it the Primary Key.
--    - Set its default value to 'uuid_generate_v4()' or leave blank if linking directly.
--    - Add a Foreign Key relation from 'profiles.id' to 'auth.users.id'.
--    - When setting up the foreign key, choose 'CASCADE' for 'ON DELETE' action.
--    - Add other columns: 'full_name' (text, nullable), 'email' (text, unique, nullable), 'role' (text, default 'user'), 'created_at' (timestamptz, default now()), 'updated_at' (timestamptz, default now()).
-- 3. As an alternative SQL method if the direct CREATE TABLE fails, try this two-step approach:
--    -- Step 1: Create table without FK initially
--    -- CREATE TABLE IF NOT EXISTS public.profiles (
--    --   id uuid NOT NULL PRIMARY KEY,
--    --   full_name text,
--    --   email text UNIQUE,
--    --   role text DEFAULT 'user'::text,
--    --   created_at timestamptz DEFAULT now(),
--    --   updated_at timestamptz DEFAULT now()
--    -- );
--    -- Step 2: Add the foreign key constraint separately
--    -- ALTER TABLE public.profiles
--    -- ADD CONSTRAINT profiles_id_fkey
--    -- FOREIGN KEY (id)
--    -- REFERENCES auth.users(id)
--    -- ON DELETE CASCADE;

-- Primary recommended SQL:
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
-- Also allows them to insert their own profile row if the 'id' matches their auth.uid().
-- This is important for the seeding script to work with the anon key.
CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);


-- Policy: Allow service_role (e.g., server-side actions using service key) to manage all profiles.
-- THIS IS IMPORTANT FOR ADMINS TO MANAGE PROFILES OR FOR CERTAIN SERVER-SIDE OPERATIONS.
CREATE POLICY "Admins (service_role) can manage all profiles"
  ON public.profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Optional: If you want new users from Supabase Auth to automatically get a profile entry
-- you can create a trigger. This is more advanced but very useful.
-- Example Trigger Function:
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS trigger
-- LANGUAGE plpgsql
-- SECURITY DEFINER SET search_path = public -- IMPORTANT: SECURITY DEFINER
-- AS $$
-- BEGIN
--   INSERT INTO public.profiles (id, email, full_name, role)
--   VALUES (
--     new.id, 
--     new.email, 
--     COALESCE(new.raw_user_meta_data->>'full_name', new.email), 
--     COALESCE(new.raw_user_meta_data->>'role', 'user')::text
--   );
--   RETURN new;
-- END;
-- $$;

-- Example Trigger (ensure the function above is created first):
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
  const profileDataToUpsert = {
    // id is the primary key and foreign key to auth.users.id
    // It MUST be set for the upsert to correctly link or update the profile.
    id: authUserId, 
    email: authUserEmail, 
    full_name: user.fullName,
    role: user.role,
  };
  
  if (!profileDataToUpsert.id) {
    console.error(`CRITICAL: Cannot seed profile for ${user.email} without a valid auth.users ID. Upsert will likely fail or create an unlinked profile.`);
    // If you want to try upserting on email as a fallback (requires email to be unique in profiles and might not link to auth.users correctly without id)
    // delete profileDataToUpsert.id; // Then set onConflict: 'email'
    // However, for profiles linked to auth.users, 'id' is the correct conflict target.
    return;
  }


  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert(profileDataToUpsert, { onConflict: 'id' }) 
    .select()
    .single();

  if (profileError) {
    console.error(`Error seeding profile for ${user.email} (Auth ID: ${authUserId}):`, profileError.message);
    if (profileError.message.includes('violates foreign key constraint')) {
        console.error(`  HINT: This often means the user with ID '${authUserId}' does not exist in 'auth.users' table, or the 'profiles' table RLS is preventing the insert/update for this ID.`);
        console.error(`  Ensure you have run the SQL from PROFILES_TABLE_SQL in your Supabase SQL editor to create the 'profiles' table with the correct foreign key to auth.users.`);
    } else if (profileError.message.includes('duplicate key value violates unique constraint "profiles_email_key"')) {
        console.error(`  HINT: A profile with email '${authUserEmail}' already exists but possibly with a different ID. Ensure 'id' is correctly passed and matches the auth.users ID for upsert.`);
    } else if (profileError.message.includes('permission denied for table profiles') || profileError.message.includes('violates row-level security policy')) {
        console.error(`  HINT: RLS on 'profiles' table is preventing this operation. Ensure your 'Users can insert their own profile' and 'Users can update their own profile' policies are active and correctly defined to allow upsert based on auth.uid() = id.`);
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
  console.log("The 'Users can insert their own profile' and 'Users can update their own profile' policies are important for this seeding script to work with the anon key.");
  console.log("For this seeding script to work best, ensure your 'profiles' table allows inserts/updates from authenticated users based on their auth.uid() matching the profile id.");

  console.log("\n--- Attempting to Seed Test Users and Profiles ---");
  console.log("This script will try to sign up test users and add/update their profiles.");
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


    