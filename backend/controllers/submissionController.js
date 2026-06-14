import prisma from '../config/prisma.js';
import { s3Client, BUCKET_NAME } from '../config/minio.js';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import Notification from '../models/notificationModel.js';

/**
 * Submit an assignment (student only). Uploads file to MinIO.
 * @route POST /api/v2/classrooms/:classroomId/assignments/:assignmentId/submit
 */
export const submitAssignment = async (req, res) => {
  const { assignmentId, classroomId } = req.params;
  const { id: userId } = req.dbUser;

  if (!req.file) return res.status(400).json({ error: 'A file is required for submission' });

  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, classroomId },
    select: { id: true, dueDate: true, title: true },
  });
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  const enrollment = await prisma.classroomEnrollment.findUnique({
    where: { userId_classroomId: { userId, classroomId } },
  });
  if (!enrollment) return res.status(403).json({ error: 'You are not enrolled in this classroom' });

  const existing = await prisma.submission.findUnique({
    where: { assignmentId_userId: { assignmentId, userId } },
  });

  const safeFileName = req.file.originalname.replace(/\s+/g, '_');
  const fileKey = `submissions/${assignmentId}/${userId}/${Date.now()}-${safeFileName}`;
  const isLate = new Date() > new Date(assignment.dueDate);

  // Delete old file if resubmitting
  if (existing?.fileKey) {
    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: existing.fileKey })).catch(() => {});
  }

  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  }));

  const submission = await prisma.submission.upsert({
    where: { assignmentId_userId: { assignmentId, userId } },
    update: { fileKey, submittedAt: new Date(), grade: null, feedback: null, isLate },
    create: { assignmentId, userId, fileKey, isLate },
    select: { id: true, submittedAt: true, isLate: true, grade: true },
  });

  res.status(201).json({
    ...submission,
    message: isLate ? 'Submitted (marked as late)' : 'Submitted successfully',
  });
};

/**
 * Grade a submission. Teacher or Admin only.
 * @route PATCH /api/v2/classrooms/:classroomId/assignments/:assignmentId/submissions/:submissionId/grade
 */
export const gradeSubmission = async (req, res) => {
  const { submissionId, classroomId, assignmentId } = req.params;
  const { grade, feedback } = req.body;

  if (grade === undefined || grade === null) return res.status(400).json({ error: 'grade is required' });

  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId }, select: { teacherId: true, name: true } });
  const { role, id: requesterId } = req.dbUser;
  if (role === 'TEACHER' && classroom?.teacherId !== requesterId) return res.status(403).json({ error: 'Forbidden' });

  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId }, select: { maxMarks: true, title: true } });
  if (parseFloat(grade) > assignment.maxMarks) {
    return res.status(400).json({ error: `Grade cannot exceed max marks (${assignment.maxMarks})` });
  }

  const submission = await prisma.submission.update({
    where: { id: submissionId },
    data: { grade: parseFloat(grade), feedback: feedback || null },
    include: { user: { select: { id: true, name: true } } },
  });

  await Notification.create({
    userId: submission.user.id,
    type: 'grade',
    title: 'Assignment graded',
    message: `Your submission for "${assignment.title}" was graded: ${grade}/${assignment.maxMarks}${feedback ? '. Feedback available.' : ''}`,
    link: `/classrooms/${classroomId}/assignments/${assignmentId}`,
    metadata: { grade, maxMarks: assignment.maxMarks },
  });

  res.json(submission);
};

/**
 * Get presigned download URL for a submission.
 * @route GET /api/v2/submissions/:submissionId/download
 */
export const getSubmissionDownloadUrl = async (req, res) => {
  const { submissionId } = req.params;
  const { role, id: userId } = req.dbUser;

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { assignment: { include: { classroom: { select: { teacherId: true } } } } },
  });
  if (!submission) return res.status(404).json({ error: 'Submission not found' });

  const isOwner = submission.userId === userId;
  const isTeacher = role === 'TEACHER' && submission.assignment.classroom.teacherId === userId;
  const isAdmin = role === 'ADMIN';
  if (!isOwner && !isTeacher && !isAdmin) return res.status(403).json({ error: 'Forbidden' });

  const url = await getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: BUCKET_NAME, Key: submission.fileKey }),
    { expiresIn: 300 }
  );
  res.json({ url, expiresIn: 300 });
};

/**
 * Get all submissions for an assignment (teacher/admin). Also shows who hasn't submitted.
 * @route GET /api/v2/classrooms/:classroomId/assignments/:assignmentId/submissions
 */
export const getSubmissionsForAssignment = async (req, res) => {
  const { assignmentId, classroomId } = req.params;

  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId }, select: { teacherId: true } });
  const { role, id: requesterId } = req.dbUser;
  if (role === 'TEACHER' && classroom?.teacherId !== requesterId) return res.status(403).json({ error: 'Forbidden' });

  const submissions = await prisma.submission.findMany({
    where: { assignmentId },
    include: { user: { select: { id: true, name: true, userId: true } } },
    orderBy: { submittedAt: 'asc' },
  });

  const enrolled = await prisma.classroomEnrollment.findMany({
    where: { classroomId },
    include: { user: { select: { id: true, name: true, userId: true } } },
  });

  const submittedIds = new Set(submissions.map(s => s.userId));
  const notSubmitted = enrolled
    .filter(e => !submittedIds.has(e.userId))
    .map(e => ({ ...e.user, submitted: false }));

  res.json({ submissions, notSubmitted });
};