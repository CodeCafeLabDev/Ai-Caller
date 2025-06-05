
'use server';

import dotenv from 'dotenv';
dotenv.config({ path: '.env.localexample' }); 

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mydatabase',
};

let connection: mysql.Connection | null = null;

export async function getDbConnection(): Promise<mysql.Connection> {
  if (connection && connection.connection && connection.connection.stream.readable && !connection.connection.stream.destroyed) {
    try {
      await connection.ping();
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
    console.log('Connecting to DB...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected.');
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

async function initializeLoginTable(): Promise<void> {
  const conn = await getDbConnection();
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS Login (
      user_Id VARCHAR(255) PRIMARY KEY NOT NULL,
      password VARCHAR(255) NOT NULL
    );
  `);
  console.log("Login table checked/created.");
}

interface SampleUserCredentials {
  userId: string;
  plainPassword_DO_NOT_USE_IN_PROD: string;
  roleHint: 'super_admin' | 'client_admin';
}

async function addSpecificSampleUser(
  userId: string,
  plainPassword: string,
  roleHint: 'super_admin' | 'client_admin'
): Promise<SampleUserCredentials | null> {
  const conn = await getDbConnection();
  const [rows] = await conn.execute<mysql.RowDataPacket[]>(
    'SELECT user_Id FROM Login WHERE user_Id = ?',
    [userId]
  );

  if (rows.length > 0) {
    console.log(`User '${userId}' already exists.`);
    return { userId, plainPassword_DO_NOT_USE_IN_PROD: plainPassword, roleHint };
  }

  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  await conn.execute(
    'INSERT INTO Login (user_Id, password) VALUES (?, ?)',
    [userId, hashedPassword]
  );
  console.log(`User '${userId}' added.`);
  return { userId, plainPassword_DO_NOT_USE_IN_PROD: plainPassword, roleHint };
}

export async function initializeDatabase(): Promise<void> {
  try {
    await initializeLoginTable();

    const superAdminUser = await addSpecificSampleUser('testUser', 'password123', 'super_admin');
    const clientAdminUser = await addSpecificSampleUser('clientTestUser', 'password123', 'client_admin');

    console.log("--- Sample Users ---");
    if (superAdminUser) {
      console.log(`Super Admin: ${superAdminUser.userId}, Password: ${superAdminUser.plainPassword_DO_NOT_USE_IN_PROD}`);
    }
    if (clientAdminUser) {
      console.log(`Client Admin: ${clientAdminUser.userId}, Password: ${clientAdminUser.plainPassword_DO_NOT_USE_IN_PROD}`);
    }
  } catch (err) {
    console.error("DB init failed:", err);
    throw err;
  }
}
