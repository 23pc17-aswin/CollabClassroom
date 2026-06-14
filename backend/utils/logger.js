/**
 * Winston structured logger — JSON in production, colorized in dev.
 * @module utils/logger
 */

import winston from 'winston';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  transports: [
    // Console — colorized in development
    new winston.transports.Console({
      format: combine(
        colorize(),
        simple()
      ),
    }),
    // File transports — JSON structured logs
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

export default logger;
