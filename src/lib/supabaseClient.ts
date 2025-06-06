
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Log the current Node environment
console.log("DEBUG supabaseClient.ts: Current NODE_ENV:", process.env.NODE_ENV);

// Log all NEXT_PUBLIC_ prefixed environment variables
console.log("DEBUG supabaseClient.ts: Attempting to list all 'NEXT_PUBLIC_*' environment variables visible to the server...");
let foundNextPublicVars = false;
Object.keys(process.env).forEach(key => {
  if (key.startsWith('NEXT_PUBLIC_')) {
    console.log(`  FOUND: ${key} = ${process.env[key] ? `"${process.env[key]?.substring(0,30)}..."` : process.env[key]}`);
    foundNextPublicVars = true;
  }
});
if (!foundNextPublicVars) {
    console.log("  DEBUG supabaseClient.ts: NO 'NEXT_PUBLIC_*' environment variables found by the server process.");
}

const supabaseUrlFromEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKeyFromEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("DEBUG supabaseClient.ts: Value of process.env.NEXT_PUBLIC_SUPABASE_URL at runtime:", supabaseUrlFromEnv);
console.log("DEBUG supabaseClient.ts: Value of process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY at runtime:", supabaseAnonKeyFromEnv ? `"${supabaseAnonKeyFromEnv.substring(0,10)}..."` : supabaseAnonKeyFromEnv);

if (!supabaseUrlFromEnv || supabaseUrlFromEnv === '') {
  const availableKeys = Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')).join(', ') || 'NONE VISIBLE';
  const errorMsg =
    "CRITICAL CONFIGURATION ERROR: NEXT_PUBLIC_SUPABASE_URL is missing or empty. " +
    "1. VERIFY `.env.local` file: Ensure it exists in your project ROOT directory and contains `NEXT_PUBLIC_SUPABASE_URL=your_url`. " +
    "2. RESTART SERVER: You MUST restart your Next.js server after creating or modifying `.env.local`. " +
    "3. CHECK IDE SETTINGS: If using a cloud IDE (like Firebase Studio), it might have specific settings for environment variables that override `.env.local`. " +
    `DETAILS: Server sees NEXT_PUBLIC_SUPABASE_URL as: '${supabaseUrlFromEnv}' (Type: ${typeof supabaseUrlFromEnv}). ` +
    `Visible NEXT_PUBLIC_ keys: [${availableKeys}]. Check server startup logs for 'DEBUG supabaseClient.ts' messages.`;
  console.error(errorMsg);
  throw new Error(errorMsg);
}

if (!supabaseAnonKeyFromEnv || supabaseAnonKeyFromEnv === '') {
  const availableKeys = Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')).join(', ') || 'NONE VISIBLE';
  const errorMsg =
    "CRITICAL CONFIGURATION ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or empty. " +
    "1. VERIFY `.env.local` file: Ensure it exists in your project ROOT directory and contains `NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key`. " +
    "2. RESTART SERVER: You MUST restart your Next.js server after creating or modifying `.env.local`. " +
    "3. CHECK IDE SETTINGS: If using a cloud IDE (like Firebase Studio), check its specific settings for environment variables. " +
    `DETAILS: Server sees NEXT_PUBLIC_SUPABASE_ANON_KEY as: '${supabaseAnonKeyFromEnv ? "******" : supabaseAnonKeyFromEnv}' (Type: ${typeof supabaseAnonKeyFromEnv}). ` +
    `Visible NEXT_PUBLIC_ keys: [${availableKeys}]. Check server startup logs for 'DEBUG supabaseClient.ts' messages.`;
  console.error(errorMsg);
  throw new Error(errorMsg);
}

export const supabase: SupabaseClient = createClient(supabaseUrlFromEnv, supabaseAnonKeyFromEnv);
console.log("DEBUG supabaseClient.ts: Supabase client initialized successfully.");
