import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env relative to project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'rentright_default_secret_key_change_in_prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  resetTokenExpiresMinutes: parseInt(process.env.RESET_TOKEN_EXPIRES_MINUTES, 10) || 60,

  // MySQL Database
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rentright_db',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
  },
};
