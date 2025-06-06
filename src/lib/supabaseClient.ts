
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Log the current Node environment
console.log("DEBUG supabaseClient.ts: Current NODE_ENV:", process.env.NODE_ENV);

// Log all NEXT_PUBLIC_ prefixed environment variables
console.log("DEBUG supabaseClient.ts: Available NEXT_PUBLIC_ environment variables:");
Object.keys(process.env).forEach(key => {
  if (key.startsWith('NEXT_PUBLIC_')) {
    console.log(`  ${key}: ${process.env[key]}`);
  }
});

const supabaseUrlFromEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKeyFromEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// More prominent logging to help debug environment variable loading
console.log("DEBUG supabaseClient.ts: Attempting to read NEXT_PUBLIC_SUPABASE_URL. Value found:", supabaseUrlFromEnv);
console.log("DEBUG supabaseClient.ts: Attempting to read NEXT_PUBLIC_SUPABASE_ANON_KEY. Value found:", supabaseAnonKeyFromEnv);

if (!supabaseUrlFromEnv) {
  console.error(
    "CRITICAL ERROR in supabaseClient.ts: NEXT_PUBLIC_SUPABASE_URL is not set or is an empty string. " +
    "This variable MUST be defined in your .env.local file in the project root. " +
    "Please verify the file exists, is correctly named ('.env.local'), is in the project root directory, contains the variable, and that the Next.js server was RESTARTED after any changes to this file. " +
    `Current value retrieved for NEXT_PUBLIC_SUPABASE_URL: '${supabaseUrlFromEnv}' (Type: ${typeof supabaseUrlFromEnv})`
  );
  throw new Error(
    "Missing environment variable NEXT_PUBLIC_SUPABASE_URL. " +
    "Please ensure it is set in your .env.local file in the root of your project."
  );
}

if (!supabaseAnonKeyFromEnv) {
  console.error(
    "CRITICAL ERROR in supabaseClient.ts: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or is an empty string. " +
    "This variable MUST be defined in your .env.local file in the project root. " +
    "Please verify the file exists, is correctly named ('.env.local'), is in the project root directory, contains the variable, and that the Next.js server was RESTARTED after any changes to this file. " +
    `Current value retrieved for NEXT_PUBLIC_SUPABASE_ANON_KEY: '${supabaseAnonKeyFromEnv}' (Type: ${typeof supabaseAnonKeyFromEnv})`
  );
  throw new Error(
    "Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "Please ensure it is set in your .env.local file in the root of your project."
  );
}

// Additional check to ensure that createClient is not called with empty strings
// although the checks above should catch undefined or empty.
if (supabaseUrlFromEnv === '' || supabaseAnonKeyFromEnv === '') {
    console.error("CRITICAL ERROR: Supabase URL or Anon Key is an empty string after initial checks. This indicates a serious configuration problem.");
    throw new Error("Supabase URL or Anon Key resolved to an empty string. Please check your .env.local configuration.");
}

export const supabase: SupabaseClient = createClient(supabaseUrlFromEnv, supabaseAnonKeyFromEnv);
