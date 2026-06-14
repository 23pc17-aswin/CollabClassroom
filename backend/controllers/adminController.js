import prisma from '../config/prisma.js';
import { createKeycloakUser, assignKeycloakRole, deleteKeycloakUser } from '../utils/keycloakAdmin.js';
import logger from '../utils/logger.js';
import { sendWelcomeEmail } from '../utils/emailService.js';

/**
 * Provision a new user in Keycloak + PostgreSQL.
 * @route POST /api/v2/admin/users
 */
export const provisionUser = async (req, res) => {
  const { email, name, userId, role } = req.body;

  if (!email || !name || !userId || !role) {
    return res.status(400).json({ error: 'Missing required fields: email, name, userId, role' });
  }
  if (!['TEACHER', 'STUDENT'].includes(role)) {
    return res.status(400).json({ error: 'Role must be TEACHER or STUDENT' });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { userId }] },
    select: { id: true },
  });
  if (existing) {
    return res.status(409).json({ error: 'A user with this email or roll number already exists' });
  }

  const temporaryPassword = `VC-${Math.random().toString(36).slice(2, 8).toUpperCase()}@${new Date().getFullYear()}`;

  const { keycloakUserId } = await createKeycloakUser({
    email,
    firstName: name.split(' ')[0],
    lastName: name.split(' ').slice(1).join(' ') || '-',
    temporaryPassword,
  });

  await assignKeycloakRole(keycloakUserId, role);

  const user = await prisma.user.create({
    data: { email, name, userId, role, keycloakId: keycloakUserId },
    select: { id: true, email: true, name: true, userId: true, role: true, createdAt: true },
  });

  // 🔥 NEW: Send the automated welcome email
  try {
      await sendWelcomeEmail(email, name, userId, temporaryPassword);
  } catch (err) {
      logger.error(`Failed to send welcome email to ${email}: ${err.message}`);
      // Note: We do NOT throw an error here. 
      // If the email fails, we still want the admin to see the user was created.
  }

  logger.info(`Admin ${req.dbUser.email} provisioned ${role}: ${email}`);
  res.status(201).json({ user, temporaryPassword });
};

/**
 * List all users with optional role filter, search, and pagination.
 * @route GET /api/v2/admin/users
 */
export const listUsers = async (req, res) => {
  const { role, page = 1, limit = 20, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(role && { role }),
    ...(search && {
      OR: [
        { name:   { contains: search, mode: 'insensitive' } },
        { email:  { contains: search, mode: 'insensitive' } },
        { userId: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, email: true, name: true, userId: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
};

/**
 * Deactivate a user (soft delete).
 * @route PATCH /api/v2/admin/users/:id/deactivate
 */
export const deactivateUser = async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, keycloakId: true, role: true } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'ADMIN') return res.status(403).json({ error: 'Cannot deactivate an admin' });

  await prisma.user.update({ where: { id }, data: { isActive: false } });
  if (user.keycloakId) await deleteKeycloakUser(user.keycloakId).catch(() => {});

  logger.info(`Admin ${req.dbUser.email} deactivated user: ${id}`);
  res.json({ message: 'User deactivated successfully' });
};

/**
 * Platform-wide statistics.
 * @route GET /api/v2/admin/stats
 */
export const getPlatformStats = async (req, res) => {
  const [totalUsers, totalClassrooms, totalAssignments, pendingGrading] = await Promise.all([
    prisma.user.count(),
    prisma.classroom.count({ where: { isArchived: false } }),
    prisma.assignment.count(),
    prisma.submission.count({ where: { grade: null } }),
  ]);

  const usersByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: { role: true },
  });

  res.json({
    totalUsers,
    totalClassrooms,
    totalAssignments,
    pendingGrading,
    usersByRole: usersByRole.reduce((acc, r) => ({ ...acc, [r.role]: r._count.role }), {}),
  });
};