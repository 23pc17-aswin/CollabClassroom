import prisma from '../config/prisma.js';
import Notification from '../models/notificationModel.js';

/**
 * Create an assignment. Teacher or Admin only.
 * @route POST /api/v2/classrooms/:classroomId/assignments
 */
export const createAssignment = async (req, res) => {
  const { classroomId } = req.params;
  const { title, description, dueDate, maxMarks = 100 } = req.body;

  if (!title || !description || !dueDate) {
    return res.status(400).json({ error: 'title, description, and dueDate are required' });
  }

  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId }, select: { teacherId: true, name: true } });
  if (!classroom) return res.status(404).json({ error: 'Classroom not found' });

  const { role, id: requesterId } = req.dbUser;
  if (role === 'TEACHER' && classroom.teacherId !== requesterId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const assignment = await prisma.assignment.create({
    data: { title, description, dueDate: new Date(dueDate), maxMarks: parseInt(maxMarks), classroomId },
  });

  // Notify enrolled students
  const enrollments = await prisma.classroomEnrollment.findMany({ where: { classroomId }, select: { userId: true } });
  await Notification.insertMany(enrollments.map(e => ({
    userId: e.userId,
    type: 'assignment',
    title: 'New assignment posted',
    message: `"${title}" posted in ${classroom.name}. Due: ${new Date(dueDate).toLocaleDateString()}`,
    link: `/classrooms/${classroomId}/assignments/${assignment.id}`,
  })));

  res.status(201).json(assignment);
};

/**
 * Get assignments for a classroom. Attaches own submission status for students.
 * @route GET /api/v2/classrooms/:classroomId/assignments
 */
export const getAssignments = async (req, res) => {
  const { classroomId } = req.params;
  const { id: userId, role } = req.dbUser;

  const assignments = await prisma.assignment.findMany({
    where: { classroomId },
    orderBy: { dueDate: 'asc' },
    include: { _count: { select: { submissions: true } } },
  });

  if (role === 'STUDENT') {
    const submissions = await prisma.submission.findMany({
      where: { userId, assignmentId: { in: assignments.map(a => a.id) } },
      select: { assignmentId: true, grade: true, submittedAt: true, isLate: true },
    });
    const subMap = Object.fromEntries(submissions.map(s => [s.assignmentId, s]));
    return res.json(assignments.map(a => ({ ...a, mySubmission: subMap[a.id] || null })));
  }

  res.json(assignments);
};

/**
 * Get a single assignment with submissions.
 * @route GET /api/v2/classrooms/:classroomId/assignments/:id
 */
export const getAssignmentById = async (req, res) => {
  const { id, classroomId } = req.params;
  const { role, id: userId } = req.dbUser;

  const assignment = await prisma.assignment.findFirst({
    where: { id, classroomId },
    include: role !== 'STUDENT'
      ? { submissions: { include: { user: { select: { id: true, name: true, userId: true } } }, orderBy: { submittedAt: 'asc' } } }
      : { submissions: { where: { userId }, select: { id: true, fileKey: true, submittedAt: true, grade: true, feedback: true, isLate: true } } },
  });

  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
  res.json(assignment);
};

/**
 * Update an assignment. Teacher or Admin only.
 * @route PATCH /api/v2/classrooms/:classroomId/assignments/:id
 */
export const updateAssignment = async (req, res) => {
  const { id, classroomId } = req.params;
  const { title, description, dueDate, maxMarks } = req.body;

  const assignment = await prisma.assignment.findFirst({ where: { id, classroomId } });
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId }, select: { teacherId: true } });
  const { role, id: requesterId } = req.dbUser;
  if (role === 'TEACHER' && classroom.teacherId !== requesterId) return res.status(403).json({ error: 'Forbidden' });

  const updated = await prisma.assignment.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description && { description }),
      ...(dueDate && { dueDate: new Date(dueDate) }),
      ...(maxMarks && { maxMarks: parseInt(maxMarks) }),
    },
  });
  res.json(updated);
};

/**
 * Delete an assignment.
 * @route DELETE /api/v2/classrooms/:classroomId/assignments/:id
 */
export const deleteAssignment = async (req, res) => {
  const { id, classroomId } = req.params;
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId }, select: { teacherId: true } });
  const { role, id: requesterId } = req.dbUser;
  if (role === 'TEACHER' && classroom?.teacherId !== requesterId) return res.status(403).json({ error: 'Forbidden' });

  await prisma.assignment.delete({ where: { id } });
  res.json({ message: 'Assignment deleted' });
};