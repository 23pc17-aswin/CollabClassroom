/**
 * HTTP request logger middleware using Winston.
 * Logs method, path, status code, and response time for every request.
 * @module middleware/requestLogger
 */

import logger from '../utils/logger.js';

/**
 * Express middleware that logs every incoming HTTP request.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: duration,
      userAgent: req.get('User-Agent') || '',
      ip: req.ip,
    });
  });

  next();
}
