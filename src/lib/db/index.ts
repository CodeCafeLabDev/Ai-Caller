
'use server';

import mysql from 'mysql2/promise';

// Database connection configuration
// IMPORTANT: Store your actual credentials in a .env file at the root of your project.
// Example .env file contents:
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

// Example usage (you can remove this or adapt it):
// export async function getSampleData() {
//   const conn = await getDbConnection();
//   try {
//     const [rows] = await conn.execute('SELECT 1 + 1 AS solution');
//     return rows;
//   } catch (error) {
//     console.error('Error executing sample query:', error);
//     // Depending on your error handling strategy, you might re-throw or return a specific error object
//     throw error; 
//   }
//   // For a single, persistent connection like this, you usually don't close it after every query.
//   // You'd close it when the application shuts down or if using a connection pool, release it.
// }
