import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import apiRouter from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { config } from './config/env.js';

export function createApp() {
  const app = express();

  // Enable CORS for frontend Vite client
  app.use(
    cors({
      origin: [config.clientUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // HTTP Request logger
  if (config.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // Mount API router
  app.use('/api', apiRouter);

  // 404 Handler
  app.use(notFoundHandler);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
