import prisma from '../config/prisma.js';
import Notification from '../models/notificationModel.js';

/**
 * Get current user profile (JIT keycloakId linking).
 * @route GET /api/v2/users/me
 */
export const getMyProfile = async (req, res) => {
  const { sub: keycloakId, email } = req.user;

  // 🔥 UPDATED: Added extended profile fields to the select block
  let user = await prisma.user.findFirst({
    where: { OR: [{ keycloakId }, { email }] },
    select: { id: true, email: true, name: true, userId: true, role: true, createdAt: true, keycloakId: true, github: true, linkedin: true, leetcode: true, resumeUrl: true, avatarUrl: true },
  });

  if (!user) {
    return res.status(403).json({ error: 'Your account has not been provisioned. Contact your administrator.' });
  }

  if (!user.keycloakId && keycloakId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { keycloakId },
      select: { id: true, email: true, name: true, userId: true, role: true, createdAt: true, github: true, linkedin: true, leetcode: true, resumeUrl: true, avatarUrl: true },
    });
  }

  res.json(user);
};

/**
 * Update own profile (name and extended fields).
 * @route PATCH /api/v2/users/me
 */
export const updateMyProfile = async (req, res) => {
  // 🔥 UPDATED: Accept the new fields from the body
  const { name, github, linkedin, leetcode, resumeUrl, avatarUrl } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const updated = await prisma.user.update({
    where: { id: req.dbUser.id },
    data: { name, github, linkedin, leetcode, resumeUrl, avatarUrl },
    select: { id: true, email: true, name: true, userId: true, role: true, github: true, linkedin: true, leetcode: true, resumeUrl: true, avatarUrl: true },
  });
  res.json(updated);
};

/**
 * Get unread notifications for the current user.
 * @route GET /api/v2/users/me/notifications
 */
export const getMyNotifications = async (req, res) => {
  const notifications = await Notification.find({ userId: req.dbUser.id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(notifications);
};

/**
 * Mark notifications as read. Body: { ids: string[] } or empty = mark all.
 * @route PATCH /api/v2/users/me/notifications/read
 */
export const markNotificationsRead = async (req, res) => {
  const { ids } = req.body;
  const filter = { userId: req.dbUser.id, ...(ids?.length && { _id: { $in: ids } }) };
  await Notification.updateMany(filter, { $set: { read: true } });
  res.json({ message: 'Notifications marked as read' });
};

/**
 * Get a student's full grade report across all classrooms.
 * @route GET /api/v2/users/:userId/grades
 */
export const getStudentGrades = async (req, res) => {
  const { userId } = req.params;
  const { role, id: requesterId } = req.dbUser;

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (role === 'STUDENT' && userId !== requesterId) return res.status(403).json({ error: 'Forbidden' });

  const [submissions, testAttempts] = await Promise.all([
    prisma.submission.findMany({
      where: { userId },
      include: {
        assignment: {
          select: {
            title: true, maxMarks: true, dueDate: true,
            classroom: { select: { id: true, name: true, subject: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    }),
    prisma.testAttempt.findMany({
      where: { userId },
      include: {
        test: {
          select: {
            title: true, totalMarks: true,
            classroom: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    }),
  ]);

  res.json({ submissions, testAttempts });
};

/**
 * List all users (admin only, but accessible from user routes with RBAC check on route level).
 * @route GET /api/v2/users
 */
export const listUsers = async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, userId: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ users });
};

/**
 * Search users by name, email, or ID for Direct Messaging.
 * @route GET /api/v2/users/search?q=xyz
 */
export const searchUsers = async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);

  // 🔥 NEW: Filter out ADMINs if the searcher is a STUDENT
  const isStudent = req.dbUser.role === 'STUDENT';
  const roleFilter = isStudent ? { role: { not: 'ADMIN' } } : {};

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: req.dbUser.id } }, // Exclude the current user from the search results
        { isActive: true },
        roleFilter, // Apply the admin block here
        {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { userId: { contains: q, mode: 'insensitive' } },
          ]
        }
      ]
    },
    // 🔥 UPDATED: Added avatarUrl
    select: { id: true, name: true, role: true, email: true, avatarUrl: true },
    take: 10, // Limit results to prevent massive payloads
  });

  res.json(users);
};