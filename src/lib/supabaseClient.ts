
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

console.log("DEBUG supabaseClient.ts: File loaded and Supabase client initialization started.");
console.log("DEBUG supabaseClient.ts: Current NODE_ENV:", process.env.NODE_ENV);

console.log("DEBUG supabaseClient.ts: Attempting to list all 'NEXT_PUBLIC_*' environment variables visible to the server...");
let foundNextPublicVars = false;
Object.keys(process.env).forEach(key => {
  if (key.startsWith('NEXT_PUBLIC_')) {
    console.log(`  FOUND: ${key} = ${process.env[key] ? `"${process.env[key]?.substring(0,30)}..."` : process.env[key]}`);
    foundNextPublicVars = true;
  }
});
if (!foundNextPublicVars) {
    console.log("  DEBUG supabaseClient.ts: NO 'NEXT_PUBLIC_*' environment variables found by the server process. This is likely the root cause of missing variable errors.");
}

const supabaseUrlFromEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKeyFromEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("DEBUG supabaseClient.ts: Value of process.env.NEXT_PUBLIC_SUPABASE_URL at runtime:", supabaseUrlFromEnv);
console.log("DEBUG supabaseClient.ts: Value of process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY at runtime:", supabaseAnonKeyFromEnv ? `"${supabaseAnonKeyFromEnv.substring(0,10)}..."` : supabaseAnonKeyFromEnv);

if (!supabaseUrlFromEnv || supabaseUrlFromEnv === '') {
  const availableKeys = Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')).join(', ') || 'NONE VISIBLE';
  const errorMsg =
    "CRITICAL CONFIGURATION ERROR: NEXT_PUBLIC_SUPABASE_URL is missing or empty.\n" +
    "TROUBLESHOOTING STEPS:\n" +
    "1. VERIFY `.env.local` FILE: Ensure it exists in your project ROOT directory and correctly contains `NEXT_PUBLIC_SUPABASE_URL=your_url`.\n" +
    "2. RESTART SERVER: You MUST restart your Next.js server after creating or modifying `.env.local`.\n" +
    "3. **FIREBASE STUDIO SETTINGS (MOST LIKELY ISSUE): Firebase Studio may override `.env.local`. You MUST check Firebase Studio's specific settings for defining Environment Variables for your Next.js application. Look for a UI or configuration file within Firebase Studio for this.**\n" +
    `DIAGNOSTIC INFO: Server sees NEXT_PUBLIC_SUPABASE_URL as: '${supabaseUrlFromEnv}' (Type: ${typeof supabaseUrlFromEnv}). Visible NEXT_PUBLIC_ keys: [${availableKeys}].\n` +
    "ACTION REQUIRED: Review your server startup logs for 'DEBUG supabaseClient.ts' messages and investigate Firebase Studio's environment variable configuration.";
  console.error(errorMsg);
  throw new Error(errorMsg);
}

if (!supabaseAnonKeyFromEnv || supabaseAnonKeyFromEnv === '') {
  const availableKeys = Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')).join(', ') || 'NONE VISIBLE';
  const errorMsg =
    "CRITICAL CONFIGURATION ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or empty.\n" +
    "TROUBLESHOOTING STEPS:\n" +
    "1. VERIFY `.env.local` FILE: Ensure it exists in your project ROOT directory and correctly contains `NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key`.\n" +
    "2. RESTART SERVER: You MUST restart your Next.js server after creating or modifying `.env.local`.\n" +
    "3. **FIREBASE STUDIO SETTINGS (MOST LIKELY ISSUE): Firebase Studio may override `.env.local`. You MUST check Firebase Studio's specific settings for defining Environment Variables for your Next.js application. Look for a UI or configuration file within Firebase Studio for this.**\n" +
    `DIAGNOSTIC INFO: Server sees NEXT_PUBLIC_SUPABASE_ANON_KEY as: '${supabaseAnonKeyFromEnv ? "******" : supabaseAnonKeyFromEnv}' (Type: ${typeof supabaseAnonKeyFromEnv}). Visible NEXT_PUBLIC_ keys: [${availableKeys}].\n` +
    "ACTION REQUIRED: Review your server startup logs for 'DEBUG supabaseClient.ts' messages and investigate Firebase Studio's environment variable configuration.";
  console.error(errorMsg);
  throw new Error(errorMsg);
}

export const supabase: SupabaseClient = createClient(supabaseUrlFromEnv, supabaseAnonKeyFromEnv);
console.log("DEBUG supabaseClient.ts: Supabase client initialized successfully using the provided environment variables.");
