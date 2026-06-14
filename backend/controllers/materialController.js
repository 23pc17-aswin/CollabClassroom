import Material from '../models/materialModel.js';
import { s3Client, BUCKET_NAME } from '../config/minio.js';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import prisma from '../config/prisma.js';

/**
 * Upload a material file. Teacher or Admin only.
 * @route POST /api/v2/classrooms/:classroomId/materials
 */
export const uploadMaterial = async (req, res) => {
  const { classroomId } = req.params;
  const { title, description } = req.body;

  if (!req.file) return res.status(400).json({ error: 'File is required' });
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId }, select: { teacherId: true } });
  if (!classroom) return res.status(404).json({ error: 'Classroom not found' });

  const { role, id: uploaderId, name: uploaderName } = req.dbUser;
  if (role === 'TEACHER' && classroom.teacherId !== uploaderId) return res.status(403).json({ error: 'Forbidden' });

  const safeFileName = req.file.originalname.replace(/\s+/g, '_');
  const fileKey = `materials/${classroomId}/${Date.now()}-${safeFileName}`;

  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  }));

  const material = await Material.create({
    classroomId,
    uploaderId,
    uploaderName,
    title,
    description,
    fileKey,
    fileName: req.file.originalname,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
  });

  res.status(201).json(material);
};

/**
 * List all materials for a classroom.
 * @route GET /api/v2/classrooms/:classroomId/materials
 */
export const getMaterials = async (req, res) => {
  const { classroomId } = req.params;
  const materials = await Material.find({ classroomId }).sort({ createdAt: -1 });
  res.json(materials);
};

/**
 * Get a presigned download URL for a material.
 * @route GET /api/v2/classrooms/:classroomId/materials/:materialId/download
 */
export const downloadMaterial = async (req, res) => {
  const { materialId } = req.params;
  const material = await Material.findById(materialId);
  if (!material) return res.status(404).json({ error: 'Material not found' });

  await Material.findByIdAndUpdate(materialId, { $inc: { downloadCount: 1 } });

  const url = await getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: BUCKET_NAME, Key: material.fileKey }),
    { expiresIn: 300 }
  );
  res.json({ url, fileName: material.fileName, expiresIn: 300 });
};

/**
 * Delete a material. Teacher or Admin only.
 * @route DELETE /api/v2/classrooms/:classroomId/materials/:materialId
 */
export const deleteMaterial = async (req, res) => {
  const { materialId, classroomId } = req.params;
  const material = await Material.findById(materialId);
  if (!material) return res.status(404).json({ error: 'Material not found' });

  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId }, select: { teacherId: true } });
  const { role, id: requesterId } = req.dbUser;
  if (role === 'TEACHER' && classroom?.teacherId !== requesterId) return res.status(403).json({ error: 'Forbidden' });

  await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: material.fileKey })).catch(() => {});
  await Material.findByIdAndDelete(materialId);

  res.json({ message: 'Material deleted' });
};