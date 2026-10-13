import mysql from 'mysql2/promise';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let poolInstance = null;

/**
 * Initializes and returns the MySQL connection pool.
 * Automatically runs table migrations from schema.sql.
 */
export async function initDatabase() {
  if (poolInstance) {
    return poolInstance;
  }

  // 1. Ensure database exists
  const tempConnection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
  });

  await tempConnection.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );
  await tempConnection.end();

  // 2. Create the connection pool with target database
  poolInstance = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    waitForConnections: true,
    connectionLimit: config.db.connectionLimit,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    multipleStatements: true,
  });

  // 3. Test connection & apply schema
  const connection = await poolInstance.getConnection();
  try {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaSql);
    console.log(`[Database] MySQL connected successfully to database "${config.db.database}" at ${config.db.host}:${config.db.port}`);
  } finally {
    connection.release();
  }

  return poolInstance;
}

/**
 * Returns the active MySQL connection pool.
 */
export function getPool() {
  if (!poolInstance) {
    throw new Error('Database pool has not been initialized. Call initDatabase() first.');
  }
  return poolInstance;
}

/**
 * Closes the connection pool gracefully.
 */
export async function closeDatabase() {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
    console.log('[Database] MySQL connection pool closed.');
  }
}
