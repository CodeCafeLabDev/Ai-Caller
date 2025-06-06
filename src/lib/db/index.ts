
'use server';
// Next.js automatically loads .env.local and other .env files.
// Ensure your DB_HOST, DB_USER, DB_PASSWORD, DB_NAME are in .env.local

import mysql from 'mysql2/promise';
// bcrypt is no longer needed here as we are not creating sample users with passwords
// import bcrypt from 'bcryptjs';

const dbConfig = {
  host: process.env.DB_HOST|| '193.203.166.175',
  user: process.env.DB_USER || 'u406732176_aicaller',
  password: process.env.DB_PASSWORD || 'Aicaller@1234',
  database: process.env.DB_NAME || 'u406732176_aicaller',
};

let connection: mysql.Connection | null = null;

export async function getDbConnection(): Promise<mysql.Connection> {
  const loggableConfig = { ...dbConfig, password: dbConfig.password ? '********' : undefined };
  console.log('Effective DB config being used for connection attempt:', loggableConfig);

  if (connection){
    try {
      await connection.ping();
      console.log('DB connection ping successful.');
      return connection;
    } catch (pingError) {
      console.warn('DB ping failed. Reconnecting...', pingError);
      try {
        await connection.end();
      } catch (endError) {
        console.warn('Error closing stale DB connection:', endError);
      }
      connection = null;
    }
  }

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log(`Successfully connected to database '${dbConfig.database}' on host '${dbConfig.host}'.`);
    return connection;
  } catch (error) {
    console.error('DB connection error:', error);
    throw new Error('Could not connect to DB.');
  }
}

export async function closeDbConnection(): Promise<void> {
  if (connection) {
    try {
      await connection.end();
      console.log('Connection closed.');
      connection = null;
    } catch (error) {
      console.error('Close error:', error);
    }
  }
}

async function initializeUsersTable(): Promise<void> {
  const conn = await getDbConnection();
  // Ensure the Users table structure is present, but we won't populate it with sample login users anymore.
  // This table might be used for other application purposes (e.g., storing user profiles not related to auth).
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS Users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_identifier VARCHAR(255) NOT NULL UNIQUE,
      -- password_hash VARCHAR(255) NOT NULL, -- No longer storing password hash here for login
      api_key VARCHAR(255) UNIQUE, -- Can store API keys if needed per user in future, but not used for current global key auth
      full_name VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
  console.log("Users table schema checked/created successfully.");
}

// Sample user creation logic is removed as authentication is now via a single hardcoded API key.
// The Users table itself is kept in case it's used for other parts of the application.

export async function initializeDatabase(): Promise<void> {
  try {
    console.log("Starting database initialization (schema check)...");
    const conn = await getDbConnection();
    
    // We no longer drop the Users table if it exists, just ensure it's there.
    // console.log("Dropping 'Users' table if it exists for a clean setup...");
    // await conn.execute('DROP TABLE IF EXISTS Users;');
    // console.log("'Users' table dropped successfully (or did not exist).");
    
    await initializeUsersTable();

    // Removing sample user insertion as login is now via a single API key
    console.log("Sample user creation for password/individual API key auth is skipped.");
    console.log("Login is now managed by a global API Key.");
    
    console.log("Database initialization process (schema check) completed.");
  } catch (err) {
    console.error("DB initialization (schema check) failed:", err);
    throw err; 
  }
}
