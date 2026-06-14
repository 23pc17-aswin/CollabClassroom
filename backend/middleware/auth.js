/**
 * Auth middleware — verifyToken + syncDbUser
 * @module middleware/auth
 */

import jwt from 'jsonwebtoken';
import { getSigningKey } from '../config/keycloak.js';
import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';

/**
 * Verifies the Keycloak Bearer JWT.
 * Attaches decoded payload to req.user on success.
 */
export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded?.header?.kid) {
      return res.status(401).json({ error: 'Invalid token format' });
    }
    const publicKey = await getSigningKey(decoded.header.kid);
    const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    req.user = payload;
    next();
  } catch (err) {
    logger.warn('Token verification failed', { message: err.message });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Loads the corresponding PostgreSQL user from keycloakId or email.
 * Attaches to req.dbUser. Must run after verifyToken.
 * Also links keycloakId on first login.
 */
export async function syncDbUser(req, res, next) {
  const keycloakId = req.user.sub;
  const email = req.user.email;

  const dbUser = await prisma.user.findFirst({
    where: { OR: [{ keycloakId }, { email }] },
    select: { id: true, email: true, name: true, userId: true, role: true, isActive: true, keycloakId: true },
  });

  if (!dbUser) {
    return res.status(403).json({ error: 'Account not provisioned. Contact your administrator.' });
  }
  if (!dbUser.isActive) {
    return res.status(403).json({ error: 'Your account has been deactivated.' });
  }

  // Link keycloakId if not yet linked (first login after provisioning)
  if (!dbUser.keycloakId) {
    await prisma.user.update({ where: { id: dbUser.id }, data: { keycloakId } });
  }

  req.dbUser = dbUser;
  next();
}
