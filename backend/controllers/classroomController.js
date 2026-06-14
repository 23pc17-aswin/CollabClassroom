import prisma from '../config/prisma.js';
import Notification from '../models/notificationModel.js';
import logger from '../utils/logger.js';

// Generate a short random classroom code
function makeCode(len = 8) {
  return Math.random().toString(36).slice(2, 2 + len).toUpperCase();
}

/**
 * Create a new classroom.
 * @route POST /api/v2/classrooms
 */
export const createClassroom = async (req, res) => {
  const { name, subject, description } = req.body;
  if (!name || !subject) return res.status(400).json({ error: 'name and subject are required' });

  const teacherId = req.dbUser.id;
  let code = makeCode();
  // Ensure uniqueness
  while (await prisma.classroom.findUnique({ where: { code } })) code = makeCode();

  const classroom = await prisma.classroom.create({
    data: { name, subject, description, code, teacherId },
    include: { teacher: { select: { id: true, name: true, email: true, avatarUrl: true } } },
  });

  logger.info(`Classroom created: ${classroom.id} by teacher: ${teacherId}`);
  res.status(201).json(classroom);
};

/**
 * Get classrooms for the requesting user based on their role.
 * @route GET /api/v2/classrooms
 */
export const getMyClassrooms = async (req, res) => {
  const { role, id } = req.dbUser;

  if (role === 'ADMIN') {
    const classrooms = await prisma.classroom.findMany({
      where: { isArchived: false },
      include: {
        teacher: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { enrollments: true, assignments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(classrooms);
  }

  if (role === 'TEACHER') {
    const classrooms = await prisma.classroom.findMany({
      where: { teacherId: id, isArchived: false },
      include: { _count: { select: { enrollments: true, assignments: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(classrooms);
  }

  // STUDENT — return enrolled classrooms
  const enrollments = await prisma.classroomEnrollment.findMany({
    where: { userId: id },
    include: {
      classroom: {
        include: {
          teacher: { select: { id: true, name: true, avatarUrl: true } },
          _count: { select: { assignments: true } },
        },
      },
    },
  });
  const classrooms = enrollments
    .filter(e => !e.classroom.isArchived)
    .map(e => e.classroom);
  res.json(classrooms);
};

/**
 * Get single classroom with full detail. Must be member or admin.
 * @route GET /api/v2/classrooms/:id
 */
export const getClassroomById = async (req, res) => {
  const classroom = await prisma.classroom.findUnique({
    where: { id: req.params.id },
    include: {
      // 🔥 FIXED: Added avatarUrl and the missing _count for enrollments/assignments
      teacher: { select: { id: true, name: true, email: true, avatarUrl: true } },
      _count: { select: { enrollments: true, assignments: true } },
      enrollments: { include: { user: { select: { id: true, name: true, userId: true, email: true, avatarUrl: true } } } },
      assignments: {
        orderBy: { dueDate: 'asc' },
        select: { id: true, title: true, dueDate: true, maxMarks: true, createdAt: true },
      },
      tests: {
        where: { isPublished: true },
        orderBy: { scheduledAt: 'asc' },
        select: { id: true, title: true, duration: true, scheduledAt: true, totalMarks: true },
      },
    },
  });

  if (!classroom) return res.status(404).json({ error: 'Classroom not found' });

  const { role, id } = req.dbUser;
  const isMember =
    role === 'ADMIN' ||
    classroom.teacherId === id ||
    classroom.enrollments.some(e => e.userId === id);

  if (!isMember) return res.status(403).json({ error: 'You are not a member of this classroom' });
  res.json(classroom);
};

/**
 * Join a classroom by code (students).
 * @route POST /api/v2/classrooms/join
 */
export const joinByCode = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code is required' });

  const classroom = await prisma.classroom.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true, name: true, isArchived: true },
  });
  if (!classroom) return res.status(404).json({ error: 'Classroom not found. Check the code and try again.' });
  if (classroom.isArchived) return res.status(400).json({ error: 'This classroom is archived' });

  const existing = await prisma.classroomEnrollment.findUnique({
    where: { userId_classroomId: { userId: req.dbUser.id, classroomId: classroom.id } },
  });
  if (existing) return res.status(409).json({ error: 'Already enrolled in this classroom' });

  await prisma.classroomEnrollment.create({
    data: { userId: req.dbUser.id, classroomId: classroom.id },
  });

  res.status(201).json({ message: `Enrolled in ${classroom.name}`, classroomId: classroom.id });
};

/**
 * Enroll students by roll numbers. Teacher or Admin only.
 * @route POST /api/v2/classrooms/:id/enroll
 */
export const enrollStudents = async (req, res) => {
  const { id: classroomId } = req.params;
  const { studentUserIds } = req.body;
  if (!studentUserIds?.length) return res.status(400).json({ error: 'studentUserIds array is required' });

  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId }, select: { id: true, name: true, teacherId: true } });
  if (!classroom) return res.status(404).json({ error: 'Classroom not found' });

  const { role, id: requesterId } = req.dbUser;
  if (role === 'TEACHER' && classroom.teacherId !== requesterId) {
    return res.status(403).json({ error: 'You can only enroll students in your own classrooms' });
  }

  const students = await prisma.user.findMany({
    where: { userId: { in: studentUserIds }, role: 'STUDENT', isActive: true },
    select: { id: true, userId: true, name: true },
  });
  if (!students.length) return res.status(404).json({ error: 'No matching active students found' });

  const enrolled = [];
  const skipped = [];

  for (const student of students) {
    const ex = await prisma.classroomEnrollment.findUnique({
      where: { userId_classroomId: { userId: student.id, classroomId } },
    });
    if (ex) { skipped.push(student.userId); continue; }
    await prisma.classroomEnrollment.create({ data: { userId: student.id, classroomId } });
    enrolled.push(student.userId);
    await Notification.create({
      userId: student.id,
      type: 'enrollment',
      title: 'Enrolled in a classroom',
      message: `You have been enrolled in ${classroom.name}`,
      link: `/classrooms/${classroomId}`,
    });
  }

  res.json({ enrolled, skipped, message: `${enrolled.length} student(s) enrolled` });
};

/**
 * Remove a student from a classroom.
 * @route DELETE /api/v2/classrooms/:id/enroll/:studentId
 */
export const removeStudent = async (req, res) => {
  const { id: classroomId, studentId } = req.params;
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId }, select: { teacherId: true } });
  if (!classroom) return res.status(404).json({ error: 'Classroom not found' });

  const { role, id: requesterId } = req.dbUser;
  if (role === 'TEACHER' && classroom.teacherId !== requesterId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await prisma.classroomEnrollment.deleteMany({ where: { userId: studentId, classroomId } });
  res.json({ message: 'Student removed from classroom' });
};

/**
 * Archive a classroom.
 * @route PATCH /api/v2/classrooms/:id/archive
 */
export const archiveClassroom = async (req, res) => {
  const { id } = req.params;
  const classroom = await prisma.classroom.findUnique({ where: { id }, select: { teacherId: true } });
  if (!classroom) return res.status(404).json({ error: 'Classroom not found' });

  const { role, id: requesterId } = req.dbUser;
  if (role === 'TEACHER' && classroom.teacherId !== requesterId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await prisma.classroom.update({ where: { id }, data: { isArchived: true } });
  res.json({ message: 'Classroom archived' });
};