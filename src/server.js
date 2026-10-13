import { createApp } from './app.js';
import { config } from './config/env.js';
import { initDatabase, closeDatabase } from './database/db.js';
import { seedDatabaseIfEmpty } from './database/seed.js';

async function startServer() {
  try {
    // 1. Initialize MySQL database & tables
    await initDatabase();

    // 2. Automatically seed categories, providers, and dummy rental items if empty
    await seedDatabaseIfEmpty();

    // 3. Initialize Express application
    const app = createApp();

    const server = app.listen(config.port, () => {
      console.log(`
=====================================================
🚀 RentRight Backend API Server is running!
📡 URL: http://localhost:${config.port}
⚙️  Environment: ${config.nodeEnv}
🐬 Database: MySQL (${config.db.database} on ${config.db.host}:${config.db.port})
🔒 Auth Routes:       http://localhost:${config.port}/api/auth
👤 User Routes:       http://localhost:${config.port}/api/users
🏷️  Category Routes:   http://localhost:${config.port}/api/categories
📦 Items Routes:      http://localhost:${config.port}/api/items
📅 Requests Routes:   http://localhost:${config.port}/api/rental-requests
💳 Payments Routes:   http://localhost:${config.port}/api/payments
=====================================================
      `);
    });

    // Graceful shutdown handling
    const handleShutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await closeDatabase();
        console.log('[Server] HTTP server closed. Exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  } catch (err) {
    console.error('[Startup Error] Failed to initialize MySQL backend:', err);
    process.exit(1);
  }
}

startServer();
