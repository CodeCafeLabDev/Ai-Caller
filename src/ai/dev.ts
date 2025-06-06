
import { initializeDatabase } from '@/lib/db';

async function main() {
  console.log('Attempting to initialize MySQL database...');
  try {
    await initializeDatabase();
    console.log('MySQL database initialization process completed successfully.');
    console.log("Sample Users for Sign In (Password: password123):");
    console.log("  Super Admin: userId 'admin'");
    console.log("  Client Admin: userId 'clientadmin'");

  } catch (error) {
    console.error('Failed to initialize MySQL database during dev startup:', error);
    console.error('Please ensure your MySQL server is running and accessible with the credentials in .env.local (or default values in src/lib/db/index.ts).');
    console.error('Required environment variables: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
  }
}

main().catch(error => {
  console.error('Error running main function in dev.ts:', error);
});
