/**
 * MinIO / S3-compatible object storage client.
 * Uses @aws-sdk/client-s3 with forcePathStyle for MinIO compatibility.
 * @module config/minio
 */

import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import logger from '../utils/logger.js';

/** S3Client pointed at MinIO (or real AWS S3 in production) */
export const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  region: 'us-east-1',
  forcePathStyle: true, // Required for MinIO
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER || 'vcminio',
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'changeme_minio123',
  },
});

/** The bucket where all classroom files are stored */
export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'virtualclassroom-files';

/**
 * Ensures the storage bucket exists, creating it if necessary.
 * Called once on backend startup.
 * @returns {Promise<void>}
 */
export async function ensureBucketExists() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    logger.info(`✅ MinIO bucket "${BUCKET_NAME}" exists`);
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
      logger.info(`✅ MinIO bucket "${BUCKET_NAME}" created`);
    } else {
      logger.error('❌ MinIO bucket check failed', { message: err.message });
      throw err;
    }
  }
}
