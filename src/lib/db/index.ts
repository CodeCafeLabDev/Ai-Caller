
'use server';

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const dbConfig = {
  host: process.env.DB_HOST || '193.203.166.175',
  user: process.env.DB_USER || 'u406732176_aicaller',
  password: process.env.DB_PASSWORD || 'Aicaller@1234',
  database: process.env.DB_NAME || 'u406732176_aicaller',
  connectTimeout: 10000 // Added a 10-second connection timeout
};

export async function getDbConnection(): Promise<mysql.Connection> {
  const loggableConfig = { ...dbConfig, password: dbConfig.password ? '********' : undefined };
  try {
    const newConnection = await mysql.createConnection(dbConfig);
    return newConnection;
  } catch (error) {
    console.error('DB connection error during createConnection:', error);
    let detailedErrorMessage = `Could not connect to DB. Host: ${dbConfig.host}, User: ${dbConfig.user}, DB: ${dbConfig.database}. Error: ${(error as Error).message}`;
    if ((error as any).code === 'ETIMEDOUT') {
      detailedErrorMessage += `\n\nETIMEDOUT errors usually indicate a network connectivity issue:
1. Check if the database server at '${dbConfig.host}' is running and accessible from your application environment.
2. Verify that the firewall on the database server (and any intermediary firewalls) allows connections from your application's IP address/range on port 3306 (or the configured MySQL port).
3. Ensure the MySQL server's 'bind-address' configuration is not restricted to localhost or specific IPs if you're connecting remotely.
4. If using a cloud database (AWS RDS, Google Cloud SQL, Azure), check its specific network security group or VPC settings.
5. Confirm there are no egress network restrictions from your application's hosting environment (Firebase Studio).`;
    }
    throw new Error(detailedErrorMessage);
  }
}

export async function closeDbConnection(connection: mysql.Connection | null): Promise<void> {
  if (connection) {
    try {
      await connection.end();
    } catch (error) {
      console.error('Error closing DB connection:', error);
    }
  }
}

async function initializeUsersTable(conn: mysql.Connection): Promise<void> {
  const createTableSQL = `
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
  `;
  console.log("DEBUG DB: Executing SQL to create Users table if it doesn't exist:\n", createTableSQL);
  await conn.execute(createTableSQL);
  console.log("DEBUG DB: MySQL 'Users' table schema checked/created successfully.");
}

async function addSampleUsers(conn: mysql.Connection): Promise<void> {
  console.log("DEBUG DB: Attempting to add sample users...");
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
      console.log(`DEBUG DB: Sample user '${user.userId}' added to the database.`);
    } else {
      console.log(`DEBUG DB: Sample user '${user.userId}' already exists in the database.`);
    }
  }
  console.log("DEBUG DB: Finished attempting to add sample users.");
}

export async function initializeDatabase(): Promise<void> {
  let conn: mysql.Connection | null = null;
  try {
    console.log("DEBUG DB: Starting database initialization (MySQL)...");
    conn = await getDbConnection();
    console.log("DEBUG DB: Successfully connected to MySQL for initialization.");
    
    await initializeUsersTable(conn);
    await addSampleUsers(conn);
    
    console.log("DEBUG DB: MySQL Database initialization process completed successfully.");
  } catch (err) {
    console.error("**************************************************");
    console.error("FATAL: MySQL DB initialization FAILED.");
    console.error("Error details:", err);
    console.error("Possible reasons: ");
    console.error("  1. Incorrect DB credentials in .env.local (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME).");
    console.error("  2. MySQL server not running or inaccessible from the application (check firewalls, bind-address, cloud provider network settings).");
    console.error("  3. The database user lacks permissions (e.g., CREATE TABLE, INSERT, SELECT).");
    console.error("**************************************************");
    throw err; 
  } finally {
    if (conn) {
      await closeDbConnection(conn);
    }
  }
}
