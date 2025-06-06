
'use server';

import mysql from 'mysql2/promise';
// bcrypt is no longer needed here if Supabase handles password hashing.
// If you still need MySQL for other purposes and store passwords, keep bcrypt.
// For now, assuming Supabase handles all auth.

const dbConfig = {
  host: process.env.DB_HOST || '193.203.166.175',
  user: process.env.DB_USER || 'u406732176_aicaller',
  password: process.env.DB_PASSWORD || 'Aicaller@1234',
  database: process.env.DB_NAME || 'u406732176_aicaller',
};

export async function getDbConnection(): Promise<mysql.Connection> {
  const loggableConfig = { ...dbConfig, password: dbConfig.password ? '********' : undefined };
  console.log('Attempting to create new DB connection with config:', loggableConfig);
  try {
    const newConnection = await mysql.createConnection(dbConfig);
    console.log(`Successfully created new connection to database '${dbConfig.database}' on host '${dbConfig.host}'.`);
    return newConnection;
  } catch (error) {
    console.error('DB connection error during createConnection:', error);
    throw new Error(`Could not connect to DB. Host: ${dbConfig.host}, User: ${dbConfig.user}, DB: ${dbConfig.database}. Error: ${(error as Error).message}`);
  }
}

export async function closeDbConnection(connection: mysql.Connection | null): Promise<void> {
  if (connection) {
    try {
      await connection.end();
      console.log('DB Connection closed successfully.');
    } catch (error) {
      console.error('Error closing DB connection:', error);
    }
  }
}

// This function might still be needed if you use the MySQL DB for other application data.
// However, for user authentication, Supabase will be the source of truth.
// The 'Users' table schema might be different if managed by Supabase or if you sync Supabase users to it.
async function initializeUsersTableIfUsed(conn: mysql.Connection): Promise<void> {
  // If you are NOT using this MySQL 'Users' table for anything other than the old login,
  // you can comment out or remove this table creation logic.
  // If you ARE using it for other user-related app data (not auth), ensure the schema is appropriate.
  // For now, let's assume it might still be used for other user details, but not for auth.
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS Users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_identifier VARCHAR(255) NOT NULL UNIQUE, -- Could be Supabase user ID or a separate app-specific ID
      -- password_hash VARCHAR(255) NOT NULL, -- Password hash managed by Supabase
      full_name VARCHAR(255),
      email VARCHAR(255) UNIQUE, -- Email managed by Supabase auth
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      role VARCHAR(50) DEFAULT 'user' -- Role might come from Supabase (e.g., via a profiles table)
    );
  `);
  console.log("MySQL 'Users' table schema checked/created (if still used for non-auth purposes).");
}

// Sample users are no longer added here as authentication is handled by Supabase.
// async function addSampleUsers(conn: mysql.Connection): Promise<void> { ... }

export async function initializeDatabase(): Promise<void> {
  let conn: mysql.Connection | null = null;
  try {
    console.log("Starting database initialization (MySQL, if still used)...");
    conn = await getDbConnection();
    // Decide if you still need this Users table in MySQL.
    // If Supabase is your single source of truth for users, you might not.
    await initializeUsersTableIfUsed(conn); 
    // Sample user creation is removed as Supabase handles users.
    console.log("MySQL Database initialization process completed (if applicable).");
  } catch (err) {
    console.error("MySQL DB initialization failed (if applicable):", err);
    // Not throwing error here if MySQL is secondary and Supabase is primary for auth.
    // throw err; 
  } finally {
    if (conn) {
      await closeDbConnection(conn);
    }
  }
}
