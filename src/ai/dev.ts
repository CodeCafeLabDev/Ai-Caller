
import { initializeDatabase } from '@/lib/db';

// Flows will be imported for their side effects in this file.

async function main() {
  console.log('Attempting to initialize database and add sample users...');
  try {
    await initializeDatabase();
    console.log('Database initialization process completed (see logs above for details).');
    console.log('Sample user credentials should be:');
    console.log('  Super Admin -> User ID: testUser, Password: password123');
    console.log('  Client Admin -> User ID: clientTestUser, Password: password123');
  } catch (error) {
    console.error('Failed to initialize database during dev startup:', error);
    console.error('Please ensure your database server is running and credentials in .env.local are correct.');
  }
}

// Run the main function
main().catch(error => {
  console.error('Error running main function in dev.ts:', error);
  // Optionally exit if critical, but for dev server, logging might be enough
  // process.exit(1); 
});
