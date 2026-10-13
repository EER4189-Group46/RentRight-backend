import { AppError } from '../utils/errors.js';
import { responseUtil } from '../utils/response.util.js';
import { config } from '../config/env.js';

/**
 * Centralized global error handling middleware.
 */
export function errorHandler(err, req, res, next) {
  if (config.nodeEnv === 'development') {
    console.error('[Error caught by middleware]:', err);
  }

  // Handle known application errors
  if (err instanceof AppError) {
    return responseUtil.error(res, err.message, err.statusCode, err.errors);
  }

  // Handle MySQL / SQLite unique constraint duplicate errors
  if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062 || (err.message && err.message.includes('UNIQUE constraint failed'))) {
    return responseUtil.error(res, 'An account with this email address already exists.', 409);
  }

  // Default to 500 Internal Server Error for unhandled exceptions
  const message = config.nodeEnv === 'production' 
    ? 'Internal server error. Please try again later.' 
    : err.message || 'Internal server error';

  return responseUtil.error(res, message, 500);
}

/**
 * 404 Route Not Found middleware.
 */
export function notFoundHandler(req, res) {
  return responseUtil.error(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}
