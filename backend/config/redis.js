/**
 * Redis client singleton using ioredis.
 * Used for Socket.io Pub/Sub adapter.
 * Connection string read from REDIS_URL env var.
 * @module config/redis
 */

import Redis from 'ioredis';
import logger from '../utils/logger.js';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // required for BullMQ compat; fine for pub/sub
  lazyConnect: true,
  enableReadyCheck: false,
});

redis.on('connect', () => logger.info('✅ Redis connected'));
redis.on('ready', () => logger.info('✅ Redis ready'));
redis.on('error', (err) => logger.error('❌ Redis error', { message: err.message }));
redis.on('close', () => logger.warn('⚠️  Redis connection closed'));

export default redis;
