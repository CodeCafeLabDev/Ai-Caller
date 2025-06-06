
import { initializeDatabase } from '@/lib/db';

// Flows will be imported for their side effects in this file.

async function main() {
  console.log('Attempting to initialize database (schema check)...');
  try {
    await initializeDatabase(); // Ensure this promise is awaited
    console.log('Database initialization (schema check) process completed successfully.');
    console.log('Authentication is now handled by a global API Key.');
    console.log('Refer to src/actions/auth.ts for the API Key.');

  } catch (error) {
    console.error('Failed to initialize database (schema check) during dev startup:', error);
    console.error('Please ensure your database server is running and credentials in .env.local are correct.');
    // Optionally, re-throw or process.exit if this is critical for dev startup
    // throw error; 
  }
}

// Run the main function
main().catch(error => {
  console.error('Error running main function in dev.ts:', error);
  // Optionally exit if critical, but for dev server, logging might be enough
  // process.exit(1); 
});
