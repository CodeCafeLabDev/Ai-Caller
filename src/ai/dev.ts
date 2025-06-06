
import { initializeDatabase } from '@/lib/db';

async function main() {
  console.log("======================================================");
  console.log("GENKIT DEV SCRIPT (src/ai/dev.ts) STARTED");
  console.log("Attempting to initialize MySQL database...");
  console.log("Please check this console output carefully for success or error messages regarding database initialization.");
  console.log("======================================================");
  try {
    await initializeDatabase();
    console.log("======================================================");
    console.log("SUCCESS: MySQL database initialization process reported completion from initializeDatabase().");
    console.log("Sample Users for Sign In (Password: password123):");
    console.log("  Super Admin: userId 'admin'");
    console.log("  Client Admin: userId 'clientadmin'");
    console.log("If the Users table or sample users are still missing in your DB, please check:");
    console.log("  1. Permissions for the DB user (needs CREATE TABLE, INSERT, SELECT).");
    console.log("  2. Any specific error messages logged above during the initialization attempt.");
    console.log("======================================================");

  } catch (error) {
    console.error("======================================================");
    console.error('CRITICAL FAILURE: Failed to initialize MySQL database during dev startup.');
    console.error("Full error from initializeDatabase():", error);
    console.error('Please ensure your MySQL server is running and accessible with the credentials in .env.local (or default values in src/lib/db/index.ts).');
    console.error('Required environment variables: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME.');
    console.error("The database user needs permissions like CREATE TABLE, INSERT, SELECT.");
    console.error("======================================================");
  }
}

main().catch(error => {
  console.error("Error running main function in dev.ts:", error);
});
