/**
 * MongoDB connection (Mongoose).
 * @module config/db
 */

import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * Connects to MongoDB using the MONGO_URI environment variable.
 * @returns {Promise<void>}
 */
async function connectMongoDB() {
  await mongoose.connect(process.env.MONGO_URI);
  logger.info('✅ MongoDB (Mongoose) connected');
}

export default connectMongoDB;