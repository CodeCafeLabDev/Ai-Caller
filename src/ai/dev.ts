
import { initializeDatabase } from '@/lib/db';

// Flows will be imported for their side effects in this file.

async function main() {
  console.log('Attempting to initialize MySQL database (if still configured for use)...');
  try {
    await initializeDatabase(); 
    console.log('MySQL database initialization process completed successfully (if applicable).');
    console.log('Authentication is now handled by Supabase.');
    console.log('Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');

  } catch (error) {
    console.error('Failed to initialize MySQL database during dev startup (if applicable):', error);
  }
}

main().catch(error => {
  console.error('Error running main function in dev.ts:', error);
});
