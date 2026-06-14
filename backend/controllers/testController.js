import prisma from '../config/prisma.js';
import Notification from '../models/notificationModel.js';

/**
 * Create a test with questions. Teacher or Admin only.
 * @route POST /api/v2/classrooms/:classroomId/tests
 */
export const createTest = async (req, res) => {
  const { classroomId } = req.params;
  const { title, description, duration, scheduledAt, totalMarks = 100, questions = [] } = req.body;

  if (!title || !duration || !scheduledAt) {
    return res.status(400).json({ error: 'title, duration, and scheduledAt are required' });
  }
  if (questions.length === 0) {
    return res.status(400).json({ error: 'At least one question is required' });
  }

  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId }, select: { teacherId: true } });
  if (!classroom) return res.status(404).json({ error: 'Classroom not found' });

  const { role, id: requesterId } = req.dbUser;
  if (role === 'TEACHER' && classroom.teacherId !== requesterId) return res.status(403).json({ error: 'Forbidden' });

  const test = await prisma.test.create({
    data: {
      title, description,
      duration: parseInt(duration),
      scheduledAt: new Date(scheduledAt),
      totalMarks: parseInt(totalMarks),
      classroomId,
      questions: {
        create: questions.map((q, idx) => ({
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          marks: parseInt(q.marks || 1),
          order: idx + 1,
        })),
      },
    },
    include: { questions: { orderBy: { order: 'asc' } } },
  });

  res.status(201).json(test);
};

/**
 * Get all tests for a classroom.
 * @route GET /api/v2/classrooms/:classroomId/tests
 */
export const getTests = async (req, res) => {
  const { classroomId } = req.params;
  const { role } = req.dbUser;

  const tests = await prisma.test.findMany({
    where: { classroomId, ...(role === 'STUDENT' && { isPublished: true }) },
    include: { _count: { select: { questions: true, attempts: true } } },
    orderBy: { scheduledAt: 'asc' },
  });
  res.json(tests);
};

/**
 * Publish a test — makes it visible to students and notifies them.
 * @route PATCH /api/v2/classrooms/:classroomId/tests/:id/publish
 */
export const publishTest = async (req, res) => {
  const { id, classroomId } = req.params;

  const test = await prisma.test.findFirst({ where: { id, classroomId } });
  if (!test) return res.status(404).json({ error: 'Test not found' });

  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId }, select: { teacherId: true, name: true } });
  const { role, id: requesterId } = req.dbUser;
  if (role === 'TEACHER' && classroom.teacherId !== requesterId) return res.status(403).json({ error: 'Forbidden' });

  await prisma.test.update({ where: { id }, data: { isPublished: true } });

  const enrollments = await prisma.classroomEnrollment.findMany({ where: { classroomId }, select: { userId: true } });
  await Notification.insertMany(enrollments.map(e => ({
    userId: e.userId,
    type: 'test',
    title: 'New test published',
    message: `"${test.title}" published in ${classroom.name}. Scheduled: ${new Date(test.scheduledAt).toLocaleString()}`,
    link: `/classrooms/${classroomId}/tests/${id}`,
  })));

  res.json({ message: 'Test published successfully' });
};

/**
 * Get a test for a student to take — strips correct answers, enforces time window.
 * @route GET /api/v2/classrooms/:classroomId/tests/:id/take
 */
export const getTestForStudent = async (req, res) => {
  const { id, classroomId } = req.params;
  const { id: userId } = req.dbUser;

  const existing = await prisma.testAttempt.findUnique({ where: { testId_userId: { testId: id, userId } } });
  if (existing) return res.status(409).json({ error: 'You have already submitted this test', attempt: existing });

  const test = await prisma.test.findFirst({
    where: { id, classroomId, isPublished: true },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        select: { id: true, questionText: true, options: true, marks: true, order: true },
        // correctAnswer intentionally excluded
      },
    },
  });
  if (!test) return res.status(404).json({ error: 'Test not found or not yet published' });

  const now = new Date();
  const scheduledAt = new Date(test.scheduledAt);
  const endsAt = new Date(scheduledAt.getTime() + test.duration * 60 * 1000);

  if (now < scheduledAt) return res.status(403).json({ error: 'Test has not started yet', scheduledAt });
  if (now > endsAt) return res.status(403).json({ error: 'Test has ended' });

  res.json({ ...test, endsAt });
};

/**
 * Submit test answers. Auto-grades MCQ questions.
 * @route POST /api/v2/classrooms/:classroomId/tests/:id/submit
 */
export const submitTest = async (req, res) => {
  const { id: testId, classroomId } = req.params;
  const { answers, timeTaken } = req.body;
  const { id: userId } = req.dbUser;

  const existing = await prisma.testAttempt.findUnique({ where: { testId_userId: { testId, userId } } });
  if (existing) return res.status(409).json({ error: 'Already submitted' });

  const test = await prisma.test.findFirst({ where: { id: testId, classroomId }, include: { questions: true } });
  if (!test) return res.status(404).json({ error: 'Test not found' });

  let score = 0;
  const gradedAnswers = (answers || []).map(ans => {
    const question = test.questions.find(q => q.id === ans.questionId);
    if (!question) return { ...ans, correct: false, marksEarned: 0 };
    const correct = ans.selectedAnswer === question.correctAnswer;
    if (correct) score += question.marks;
    return { ...ans, correct, correctAnswer: question.correctAnswer, marksEarned: correct ? question.marks : 0 };
  });

  const attempt = await prisma.testAttempt.create({
    data: { testId, userId, answers: gradedAnswers, score, timeTaken: timeTaken || null },
  });

  res.status(201).json({
    attempt,
    score,
    total: test.totalMarks,
    percentage: ((score / test.totalMarks) * 100).toFixed(1),
  });
};

/**
 * Get test results. Teacher sees all, student sees own.
 * @route GET /api/v2/classrooms/:classroomId/tests/:id/results
 */
export const getTestResults = async (req, res) => {
  const { id: testId, classroomId } = req.params;
  const { role, id: userId } = req.dbUser;

  if (role === 'STUDENT') {
    const attempt = await prisma.testAttempt.findUnique({ where: { testId_userId: { testId, userId } } });
    return res.json(attempt || { message: 'Not yet attempted' });
  }

  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId }, select: { teacherId: true } });
  if (role === 'TEACHER' && classroom?.teacherId !== userId) return res.status(403).json({ error: 'Forbidden' });

  const [attempts, enrolled] = await Promise.all([
    prisma.testAttempt.findMany({
      where: { testId },
      include: { user: { select: { id: true, name: true, userId: true } } },
      orderBy: { score: 'desc' },
    }),
    prisma.classroomEnrollment.count({ where: { classroomId } }),
  ]);

  const scores = attempts.map(a => a.score || 0);
  const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
  const highest = scores.length ? Math.max(...scores) : 0;

  res.json({ attempts, stats: { total: enrolled, attempted: attempts.length, average: avg, highest } });
};