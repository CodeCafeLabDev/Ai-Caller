
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
  const availableKeys = Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')).join(', ') || 'None';
  const errorMsg =
    "Missing environment variable NEXT_PUBLIC_SUPABASE_URL. " +
    "Please ensure it is set in your .env.local file in the project root AND that your Next.js server was RESTARTED after any changes. " +
    "If using a cloud IDE like Firebase Studio, check its specific settings for environment variables as they might override .env.local. " +
    `Current value retrieved for NEXT_PUBLIC_SUPABASE_URL: '${supabaseUrlFromEnv}' (Type: ${typeof supabaseUrlFromEnv}). ` +
    `Available NEXT_PUBLIC_ keys found by the server: [${availableKeys}].`;
  console.error("CRITICAL ERROR in supabaseClient.ts: " + errorMsg);
  throw new Error(errorMsg);
}

if (!supabaseAnonKeyFromEnv) {
  const availableKeys = Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')).join(', ') || 'None';
  const errorMsg =
    "Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "Please ensure it is set in your .env.local file in the project root AND that your Next.js server was RESTARTED after any changes. " +
    "If using a cloud IDE like Firebase Studio, check its specific settings for environment variables. " +
    `Current value retrieved for NEXT_PUBLIC_SUPABASE_ANON_KEY: '${supabaseAnonKeyFromEnv}' (Type: ${typeof supabaseAnonKeyFromEnv}). ` +
    `Available NEXT_PUBLIC_ keys found by the server: [${availableKeys}].`;
  console.error("CRITICAL ERROR in supabaseClient.ts: " + errorMsg);
  throw new Error(errorMsg);
}

// Additional check to ensure that createClient is not called with empty strings
// although the checks above should catch undefined or empty.
if (supabaseUrlFromEnv === '' || supabaseAnonKeyFromEnv === '') {
    const detailMsg = `Supabase URL: '${supabaseUrlFromEnv}', Anon Key: '${supabaseAnonKeyFromEnv.substring(0, 10)}...' (keys are non-empty strings, but resolved to empty which is invalid).`;
    console.error("CRITICAL ERROR: Supabase URL or Anon Key is an empty string after initial checks. This indicates a serious configuration problem. " + detailMsg);
    throw new Error("Supabase URL or Anon Key resolved to an empty string. Please check your .env.local configuration and server logs for more details. " + detailMsg);
}

export const supabase: SupabaseClient = createClient(supabaseUrlFromEnv, supabaseAnonKeyFromEnv);
