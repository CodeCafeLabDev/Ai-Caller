
'use server';

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Database connection configuration
// IMPORTANT: Store your actual credentials in a .env.local file at the root of your project.
// Example .env.local file contents:
// DB_HOST=your_db_host
// DB_USER=your_db_user
// DB_PASSWORD=your_db_password
// DB_NAME=your_db_name

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mydatabase',
  // You might need to configure SSL for some cloud database providers
  // ssl: {
  //   rejectUnauthorized: process.env.NODE_ENV === 'production' 
  // }
};

let connection: mysql.Connection | null = null;

/**
 * Establishes or returns an existing database connection.
 * It includes a basic check to ensure the connection is still active.
 */
export async function getDbConnection(): Promise<mysql.Connection> {
  // If connection exists and is active, return it
  if (connection && connection.connection && connection.connection.stream.readable && !connection.connection.stream.destroyed) {
    try {
      await connection.ping(); // Check if connection is still alive
      return connection;
    } catch (pingError) {
      console.warn('DB connection ping failed, attempting to reconnect.', pingError);
      try {
        await connection.end(); // Gracefully close stale connection
      } catch (endError) {
        console.warn('Error closing stale DB connection:', endError);
      }
      connection = null; // Nullify stale connection
    }
  }

  // Create a new connection
  try {
    console.log('Attempting to connect to database with config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      // Password is intentionally omitted from logs for security
    });
    connection = await mysql.createConnection(dbConfig);
    console.log('Successfully connected to the database.');
    return connection;
  } catch (error) {
    console.error('Error connecting to the database:', error);
    // It's good to throw a more specific error or handle it appropriately
    throw new Error('Could not establish database connection.');
  }
}

/**
 * Closes the current database connection if it exists.
 * Useful for cleanup, e.g., during application shutdown.
 */
export async function closeDbConnection(): Promise<void> {
  if (connection) {
    try {
      await connection.end();
      console.log('Database connection closed.');
      connection = null;
    } catch (error) {
      console.error('Error closing database connection:', error);
      throw new Error('Could not close database connection.');
    }
  }
}

/**
 * Creates the 'Login' table if it doesn't already exist.
 */
async function initializeLoginTable(): Promise<void> {
  const conn = await getDbConnection();
  const createLoginTableSQL = `
    CREATE TABLE IF NOT EXISTS Login (
      user_Id VARCHAR(255) PRIMARY KEY NOT NULL,
      password VARCHAR(255) NOT NULL
    );
  `;
  try {
    await conn.execute(createLoginTableSQL);
    console.log("Table 'Login' initialized successfully or already exists.");
  } catch (error) {
    console.error("Error creating 'Login' table:", error);
    throw new Error("Could not initialize 'Login' table.");
  }
}

interface SampleUserCredentials {
  userId: string;
  plainPassword_DO_NOT_USE_IN_PROD: string;
  roleHint: 'super_admin' | 'client_admin';
}

/**
 * Adds a specific sample user to the Login table if they do not already exist.
 */
async function addSpecificSampleUser(
  userId: string,
  plainPassword: string,
  roleHint: 'super_admin' | 'client_admin'
): Promise<SampleUserCredentials | null> {
  const conn = await getDbConnection();
  try {
    const [rows] = await conn.execute<mysql.RowDataPacket[]>(
      'SELECT user_Id FROM Login WHERE user_Id = ?',
      [userId]
    );

    if (rows.length > 0) {
      console.log(`Sample user '${userId}' already exists.`);
      return { userId, plainPassword_DO_NOT_USE_IN_PROD: plainPassword, roleHint };
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    await conn.execute(
      'INSERT INTO Login (user_Id, password) VALUES (?, ?)',
      [userId, hashedPassword]
    );
    console.log(`Sample user '${userId}' added successfully.`);
    return { userId, plainPassword_DO_NOT_USE_IN_PROD: plainPassword, roleHint };
  } catch (error) {
    console.error(`Error adding or checking sample user '${userId}':`, error);
    // Return null or throw, depending on how critical this is for your app startup
    // For this example, we'll log error and return null to allow app to continue if possible
    return null; 
  }
}


/**
 * Initializes all necessary database tables and adds sample users.
 * Call this function when your application starts or during a setup phase.
 */
export async function initializeDatabase(): Promise<void> {
  try {
    await initializeLoginTable();
    
    console.log("--- Sample User Credentials (for testing ONLY) ---");

    const superAdminUser = await addSpecificSampleUser('testUser', 'password123', 'super_admin');
    if (superAdminUser) {
      console.log(`Super Admin User ID: ${superAdminUser.userId}`);
      console.log(`Super Admin Password: ${superAdminUser.plainPassword_DO_NOT_USE_IN_PROD}`);
    }

    const clientAdminUser = await addSpecificSampleUser('clientTestUser', 'password123', 'client_admin');
    if (clientAdminUser) {
      console.log(`Client Admin User ID: ${clientAdminUser.userId}`);
      console.log(`Client Admin Password: ${clientAdminUser.plainPassword_DO_NOT_USE_IN_PROD}`);
    }
    
    console.log("-------------------------------------------------");
    console.log("Database initialization complete. Check console for sample user credentials.");
  } catch (error) {
    console.error("Error during database initialization:", error);
    throw error; // Re-throw to indicate failure
  }
}

// Example of how you might call initializeDatabase during app startup:
// You would typically call this ONCE during your application's setup phase.
// For example, in a script you run manually, or at the beginning of your server if appropriate.
// 
// (async () => {
//   try {
//     await initializeDatabase();
//     // Proceed with application startup
//   } catch (error) {
//     console.error('Failed to initialize database. Application might not work correctly.', error);
//     // process.exit(1); // Optional: exit if DB initialization is critical
//   }
// })();

