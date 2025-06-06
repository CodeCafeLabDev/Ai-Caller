
'use server';

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const dbConfig = {
  host: process.env.DB_HOST || '193.203.166.175', // Default to your provided host
  user: process.env.DB_USER || 'u406732176_aicaller', // Default to your provided user
  password: process.env.DB_PASSWORD || 'Aicaller@1234', // Default to your provided password
  database: process.env.DB_NAME || 'u406732176_aicaller', // Default to your provided database
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
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS Users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_identifier VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
  console.log("MySQL 'Users' table schema checked/created successfully.");
}

async function addSampleUsers(conn: mysql.Connection): Promise<void> {
  const users = [
    { userId: 'admin', pass: 'password123', fullName: 'Super Admin', email: 'admin@example.com', role: 'super_admin' },
    { userId: 'clientadmin', pass: 'password123', fullName: 'Client Admin User', email: 'clientadmin@example.com', role: 'client_admin' },
  ];

  for (const user of users) {
    const [rows] = await conn.execute('SELECT * FROM Users WHERE user_identifier = ?', [user.userId]);
    if ((rows as any[]).length === 0) {
      const passwordHash = await bcrypt.hash(user.pass, 10);
      await conn.execute(
        'INSERT INTO Users (user_identifier, password_hash, full_name, email, role) VALUES (?, ?, ?, ?, ?)',
        [user.userId, passwordHash, user.fullName, user.email, user.role]
      );
      console.log(`Sample user '${user.userId}' added to the database.`);
    } else {
      console.log(`Sample user '${user.userId}' already exists.`);
    }
  }
}

export async function initializeDatabase(): Promise<void> {
  let conn: mysql.Connection | null = null;
  try {
    console.log("Starting database initialization (MySQL)...");
    conn = await getDbConnection();
    await initializeUsersTable(conn);
    await addSampleUsers(conn);
    console.log("MySQL Database initialization process completed.");
  } catch (err) {
    console.error("MySQL DB initialization failed:", err);
    throw err; 
  } finally {
    if (conn) {
      await closeDbConnection(conn);
    }
  }
}
