
import { initializeDatabase } from '@/lib/db';

// Flows will be imported for their side effects in this file.

async function main() {
  console.log('Attempting to initialize database...');
  try {
    await initializeDatabase(); 
    console.log('Database initialization process completed successfully.');
    console.log('Sample users (testUser, clientTestUser, dineshUser) should be available with password "password123".');
    console.log('Authentication uses User ID and Password against the database.');

  } catch (error)
{
    console.error('Failed to initialize database during dev startup:', error);
    console.error('Please ensure your database server is running and credentials in .env.local are correct.');
  }
}

main().catch(error => {
  console.error('Error running main function in dev.ts:', error);
});
