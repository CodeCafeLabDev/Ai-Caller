
'use server';

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

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

async function initializeUsersTable(conn: mysql.Connection): Promise<void> {
  await conn.execute('DROP TABLE IF EXISTS Users;');
  console.log("'Users' table dropped successfully (or did not exist).");

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS Users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_identifier VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      role VARCHAR(50) DEFAULT 'user'
    );
  `);
  console.log("Users table schema checked/created successfully (with role column).");
}

async function addSampleUsers(conn: mysql.Connection): Promise<void> {
  const users = [
    { user_identifier: 'testUser', password: 'password123', full_name: 'Test User', email: 'testuser@example.com', role: 'super_admin' },
    { user_identifier: 'clientTestUser', password: 'password123', full_name: 'Client Test User', email: 'clienttest@example.com', role: 'client_admin' },
    { user_identifier: 'dineshUser', password: 'password123', full_name: 'Dinesh', email: 'dinesh@example.com', role: 'client_admin' },
  ];

  for (const user of users) {
    try {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await conn.execute(
        'INSERT INTO Users (user_identifier, password_hash, full_name, email, role) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), full_name = VALUES(full_name), email = VALUES(email), role = VALUES(role)',
        [user.user_identifier, hashedPassword, user.full_name, user.email, user.role]
      );
      console.log(`User '${user.user_identifier}' added/updated successfully with role '${user.role}'.`);
    } catch (error) {
      console.error(`Error adding/updating user ${user.user_identifier}:`, error);
    }
  }
}

export async function initializeDatabase(): Promise<void> {
  let conn: mysql.Connection | null = null;
  try {
    console.log("Starting database initialization...");
    conn = await getDbConnection();
    await initializeUsersTable(conn);
    await addSampleUsers(conn);
    console.log("Database initialization process completed.");
  } catch (err) {
    console.error("DB initialization failed:", err);
    throw err; 
  } finally {
    if (conn) {
      await closeDbConnection(conn);
    }
  }
}
