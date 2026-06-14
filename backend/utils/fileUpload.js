/**
 * Multer file upload configuration.
 * Uses memoryStorage — files are held as Buffer in req.file.buffer
 * and uploaded directly to MinIO without touching disk.
 * @module utils/fileUpload
 */

import multer from 'multer';

/** Allowed MIME types for classroom materials */
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'image/png',
  'image/jpeg',
  'image/jpg',
  'video/mp4',
];

/**
 * Multer instance configured with in-memory storage.
 * @type {import('multer').Multer}
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`), false);
    }
  },
});

export default upload;