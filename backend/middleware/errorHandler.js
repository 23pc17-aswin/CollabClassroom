/**
 * Global Express error handler.
 * Must be registered LAST in the middleware chain (after all routes).
 * @module middleware/errorHandler
 */

import logger from '../utils/logger.js';

/**
 * Centralized error handling middleware.
 * Formats all thrown errors into a consistent JSON response shape.
 *
 * @param {Error} err - The error object
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error('Unhandled error', {
    status,
    message,
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  res.status(status).json({
    error: status >= 500 ? 'Internal Server Error' : message,
    message: status >= 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : message,
  });
}
