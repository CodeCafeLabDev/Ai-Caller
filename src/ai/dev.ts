
// import { initializeDatabase } from '@/lib/db'; // Removed MySQL DB initialization

// Flows will be imported for their side effects in this file.

async function main() {
  // console.log('Attempting to initialize MySQL database (if still configured for use)...');
  // try {
  //   await initializeDatabase(); // MySQL is no longer used for auth
  //   console.log('MySQL database initialization process completed successfully (if applicable).');
  // } catch (error) {
  //   console.error('Failed to initialize MySQL database during dev startup (if applicable):', error);
  // }
  
  console.log('Authentication is now handled by hardcoded credentials in src/actions/auth.ts.');
  console.log("Mock Users for Sign In:");
  console.log("  Super Admin: userId 'admin', password 'password123'");
  console.log("  Client Admin: userId 'clientadmin', password 'password123'");
  console.log('Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are REMOVED from .env.local if Supabase is no longer used.');
}

main().catch(error => {
  console.error('Error running main function in dev.ts:', error);
});
