
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrlFromEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKeyFromEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (typeof supabaseUrlFromEnv === 'undefined') {
  console.error(
    "DEBUG: supabaseClient.ts - 'NEXT_PUBLIC_SUPABASE_URL' was read as 'undefined' from process.env. " +
    "Please ensure it is correctly set in your .env.local file in the project root and that the server was restarted."
  );
} else if (supabaseUrlFromEnv === '') {
  console.error(
    "DEBUG: supabaseClient.ts - 'NEXT_PUBLIC_SUPABASE_URL' was read as an EMPTY STRING from process.env. " +
    "Please ensure it has a valid value in your .env.local file."
  );
}

if (!supabaseUrlFromEnv) {
  throw new Error(
    "Missing environment variable NEXT_PUBLIC_SUPABASE_URL. " +
    "Please ensure it is set in your .env.local file in the root of your project."
  );
}

if (typeof supabaseAnonKeyFromEnv === 'undefined') {
  console.error(
    "DEBUG: supabaseClient.ts - 'NEXT_PUBLIC_SUPABASE_ANON_KEY' was read as 'undefined' from process.env. " +
    "Please ensure it is correctly set in your .env.local file in the project root and that the server was restarted."
  );
} else if (supabaseAnonKeyFromEnv === '') {
  console.error(
    "DEBUG: supabaseClient.ts - 'NEXT_PUBLIC_SUPABASE_ANON_KEY' was read as an EMPTY STRING from process.env. " +
    "Please ensure it has a valid value in your .env.local file."
  );
}

if (!supabaseAnonKeyFromEnv) {
  throw new Error(
    "Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "Please ensure it is set in your .env.local file in the root of your project."
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrlFromEnv, supabaseAnonKeyFromEnv);
