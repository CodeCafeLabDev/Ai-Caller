
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing environment variable NEXT_PUBLIC_SUPABASE_URL. " +
    "Please ensure it is set in your .env.local file in the root of your project."
  );
}
if (!supabaseAnonKey) {
  throw new Error(
    "Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "Please ensure it is set in your .env.local file in the root of your project."
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
