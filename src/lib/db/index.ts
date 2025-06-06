
'use server';

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const dbConfig = {
  host: process.env.DB_HOST || '193.203.166.175',
  user: process.env.DB_USER || 'u406732176_aicaller',
  password: process.env.DB_PASSWORD || 'Aicaller@1234',
  database: process.env.DB_NAME || 'u406732176_aicaller',
};

let connection: mysql.Connection | null = null;

export async function getDbConnection(): Promise<mysql.Connection> {
  const loggableConfig = { ...dbConfig, password: dbConfig.password ? '********' : undefined };
  console.log('Effective DB config being used for connection attempt:', loggableConfig);

  if (connection) {
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
    throw new Error(`Could not connect to DB. Host: ${dbConfig.host}, User: ${dbConfig.user}, DB: ${dbConfig.database}. Error: ${(error as Error).message}`);
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
  await conn.execute('DROP TABLE IF EXISTS Users;'); // Drop existing Users table for clean setup
  console.log("'Users' table dropped successfully (or did not exist).");

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS Users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_identifier VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
  console.log("Users table schema checked/created successfully.");
}

async function addSampleUsers(): Promise<void> {
  const conn = await getDbConnection();
  const users = [
    { user_identifier: 'testUser', password: 'password123', full_name: 'Test User', email: 'testuser@example.com' },
    { user_identifier: 'clientTestUser', password: 'password123', full_name: 'Client Test User', email: 'clienttest@example.com' },
    { user_identifier: 'dineshUser', password: 'password123', full_name: 'Dinesh', email: 'dinesh@example.com' },
  ];

  for (const user of users) {
    try {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await conn.execute(
        'INSERT INTO Users (user_identifier, password_hash, full_name, email) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), full_name = VALUES(full_name), email = VALUES(email)',
        [user.user_identifier, hashedPassword, user.full_name, user.email]
      );
      console.log(`User '${user.user_identifier}' added/updated successfully.`);
    } catch (error) {
      console.error(`Error adding/updating user ${user.user_identifier}:`, error);
    }
  }
}

export async function initializeDatabase(): Promise<void> {
  try {
    console.log("Starting database initialization...");
    await initializeUsersTable();
    await addSampleUsers();
    console.log("Database initialization process completed.");
  } catch (err) {
    console.error("DB initialization failed:", err);
    throw err;
  }
}
