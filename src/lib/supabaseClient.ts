
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

console.log("DEBUG supabaseClient.ts: File loaded. Supabase client initialization sequence starting.");
console.log("DEBUG supabaseClient.ts: Current NODE_ENV:", process.env.NODE_ENV);

console.log("DEBUG supabaseClient.ts: Listing all 'NEXT_PUBLIC_*' environment variables visible to the server process...");
let foundNextPublicVars = false;
Object.keys(process.env).forEach(key => {
  if (key.startsWith('NEXT_PUBLIC_')) {
    console.log(`  DEBUG supabaseClient.ts: FOUND VAR: ${key} = ${process.env[key] ? `"${String(process.env[key]).substring(0,30)}..."` : process.env[key]}`);
    foundNextPublicVars = true;
  }
});
if (!foundNextPublicVars) {
    console.warn("  DEBUG supabaseClient.ts: WARNING: NO 'NEXT_PUBLIC_*' environment variables found by the server process. This is the likely root cause of missing variable errors if they occur.");
}

const supabaseUrlFromEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKeyFromEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("DEBUG supabaseClient.ts: Value of process.env.NEXT_PUBLIC_SUPABASE_URL at runtime:", supabaseUrlFromEnv);
console.log("DEBUG supabaseClient.ts: Value of process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY at runtime:", supabaseAnonKeyFromEnv ? `"${String(supabaseAnonKeyFromEnv).substring(0,10)}..." (length: ${String(supabaseAnonKeyFromEnv).length})` : supabaseAnonKeyFromEnv);

if (!supabaseUrlFromEnv || supabaseUrlFromEnv.trim() === '') {
  const availableKeys = Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')).join(', ') || 'NONE VISIBLE';
  const errorMsg =
    "CRITICAL CONFIGURATION ERROR: NEXT_PUBLIC_SUPABASE_URL is missing or empty.\n" +
    "TROUBLESHOOTING STEPS:\n" +oush
    "1. VERIFY `.env.local` FILE: Ensure it exists in your project ROOT directory and correctly contains `NEXT_PUBLIC_SUPABASE_URL=your_url`.\n" +
    "2. RESTART SERVER: You MUST restart your Next.js server after creating or modifying `.env.local` OR Firebase Studio's environment variable settings.\n" +
    "3. **FIREBASE STUDIO SETTINGS (MOST LIKELY ISSUE): Firebase Studio may override `.env.local`. You MUST check Firebase Studio's specific settings for defining Environment Variables for your Next.js application. Look for a UI or configuration file within Firebase Studio for this.**\n" +
    `DIAGNOSTIC INFO: Server sees NEXT_PUBLIC_SUPABASE_URL as: '${supabaseUrlFromEnv}' (Type: ${typeof supabaseUrlFromEnv}). Visible NEXT_PUBLIC_ keys: [${availableKeys}].\n` +
    "ACTION REQUIRED: Review your server startup logs for 'DEBUG supabaseClient.ts' messages and investigate Firebase Studio's environment variable configuration.";
  console.error("ERROR THROWN FROM supabaseClient.ts:", errorMsg);
  throw new Error(errorMsg);
}

if (!supabaseAnonKeyFromEnv || supabaseAnonKeyFromEnv.trim() === '') {
  const availableKeys = Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')).join(', ') || 'NONE VISIBLE';
  const errorMsg =
    "CRITICAL CONFIGURATION ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or empty.\n" +
    "TROUBLESHOOTING STEPS:\n" +
    "1. VERIFY `.env.local` FILE: Ensure it exists in your project ROOT directory and correctly contains `NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key`.\n" +
    "2. RESTART SERVER: You MUST restart your Next.js server after creating or modifying `.env.local` OR Firebase Studio's environment variable settings.\n" +
    "3. **FIREBASE STUDIO SETTINGS (MOST LIKELY ISSUE): Firebase Studio may override `.env.local`. You MUST check Firebase Studio's specific settings for defining Environment Variables for your Next.js application. Look for a UI or configuration file within Firebase Studio for this.**\n" +
    `DIAGNOSTIC INFO: Server sees NEXT_PUBLIC_SUPABASE_ANON_KEY as: '${supabaseAnonKeyFromEnv ? "******" : supabaseAnonKeyFromEnv}' (Type: ${typeof supabaseAnonKeyFromEnv}). Visible NEXT_PUBLIC_ keys: [${availableKeys}].\n` +
    "ACTION REQUIRED: Review your server startup logs for 'DEBUG supabaseClient.ts' messages and investigate Firebase Studio's environment variable configuration.";
  console.error("ERROR THROWN FROM supabaseClient.ts:", errorMsg);
  throw new Error(errorMsg);
}

let supabaseInstance: SupabaseClient;

try {
  console.log(`DEBUG supabaseClient.ts: Attempting to call createClient with URL: "${supabaseUrlFromEnv}" and Key: "${supabaseAnonKeyFromEnv ? String(supabaseAnonKeyFromEnv).substring(0,10) + '...' : 'MISSING/EMPTY'}"`);
  supabaseInstance = createClient(supabaseUrlFromEnv, supabaseAnonKeyFromEnv);
  console.log("DEBUG supabaseClient.ts: Supabase client initialized successfully using the provided environment variables.");
} catch (error: any) {
  console.error("ERROR supabaseClient.ts: Error during Supabase client CREATION (createClient call):", error.message);
  console.error("ERROR supabaseClient.ts: This could be due to malformed URL/Key even if they are present, or other issues with the Supabase SDK itself.");
  throw new Error(`Failed to create Supabase client: ${error.message}. URL used: "${supabaseUrlFromEnv}", Key Used (prefix): "${supabaseAnonKeyFromEnv ? String(supabaseAnonKeyFromEnv).substring(0,10) + '...' : 'MISSING/EMPTY'}"`);
}

export const supabase: SupabaseClient = supabaseInstance;
