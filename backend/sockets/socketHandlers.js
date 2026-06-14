/**
 * Socket.io event handlers — chat, presence, typing.
 * Every socket connection is authenticated via Keycloak JWT.
 * @module sockets/socketHandlers
 */

import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import Message from '../models/messageModel.js';
import prisma from '../config/prisma.js';
import redis from '../config/redis.js';
import logger from '../utils/logger.js';

const jwksClient = jwksRsa({
  jwksUri: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxAge: 600000,
});

const verifySocketToken = (token) => new Promise((resolve, reject) => {
  const getKey = (header, cb) =>
    jwksClient.getSigningKey(header.kid, (e, k) => e ? cb(e) : cb(null, k.getPublicKey()));
  jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) =>
    err ? reject(err) : resolve(decoded)
  );
});

export const registerSocketHandlers = (io) => {

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = await verifySocketToken(token);
      const dbUser = await prisma.user.findFirst({
        where: { OR: [{ keycloakId: decoded.sub }, { email: decoded.email }] },
        select: { id: true, name: true, role: true, isActive: true },
      });
      if (!dbUser || !dbUser.isActive) return next(new Error('User not found or inactive'));
      socket.user = dbUser;
      next();
    } catch (err) {
      logger.warn(`Socket auth failed: ${err.message}`);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const { id: userId, name, role } = socket.user;
    logger.info(`Socket connected: ${name} (${role})`);

    // Every user joins a personal room so they can receive Direct Messages!
    socket.join(`user:${userId}`);

    await redis.set(`session:${userId}`, JSON.stringify({ name, role, socketId: socket.id }), 'EX', 86400).catch(() => {});

    // ── JOIN CLASSROOM ROOM ─────────────────────────────────────────────────
    socket.on('classroom:join', async (classroomId) => {
      try {
        socket.join(`classroom:${classroomId}`);
        
        await redis.sadd(`classroom:${classroomId}:online`, userId).catch(() => {});
        const onlineIds = await redis.smembers(`classroom:${classroomId}:online`).catch(() => []);
        
        io.to(`classroom:${classroomId}`).emit('presence:update', onlineIds);
        socket.emit('classroom:joined', { classroomId });
      } catch (err) {
        socket.emit('error', 'Failed to join classroom');
      }
    });

    // ── LEAVE CLASSROOM ROOM ────────────────────────────────────────────────
    socket.on('classroom:leave', async (classroomId) => {
      socket.leave(`classroom:${classroomId}`);
      await redis.srem(`classroom:${classroomId}:online`, userId).catch(() => {});
      const onlineIds = await redis.smembers(`classroom:${classroomId}:online`).catch(() => []);
      io.to(`classroom:${classroomId}`).emit('presence:update', onlineIds);
    });

    // ── SEND CLASSROOM MESSAGE ──────────────────────────────────────────────
    socket.on('chat:send', async ({ classroomId, text }) => {
      try {
        if (!text?.trim() || text.length > 2000) {
          return socket.emit('error', 'Invalid message: too long or empty');
        }

        const message = await Message.create({
          classroomId,
          senderId: userId,
          senderName: name,
          senderRole: role,
          text: text.trim(),
          type: 'text',
        });

        io.to(`classroom:${classroomId}`).emit('chat:message', message);
      } catch (err) {
        logger.error(`chat:send error: ${err.message}`);
        socket.emit('error', 'Failed to save message to database');
      }
    });

    // ── SEND PRIVATE DIRECT MESSAGE ─────────────────────────────────
    socket.on('dm:send', async ({ receiverId, text }) => {
      try {
        if (!text?.trim() || text.length > 2000) return socket.emit('error', 'Invalid message');

        // 🔥 NEW: Verify receiver role to prevent Students from DMing Admins
        const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
        if (!receiver) return socket.emit('error', 'User not found');
        
        if (role === 'STUDENT' && receiver.role === 'ADMIN') {
            return socket.emit('error', 'Students are not permitted to direct message Administrators.');
        }

        const message = await Message.create({
          receiverId,
          senderId: userId,
          senderName: name,
          senderRole: role,
          text: text.trim(),
          type: 'text',
        });

        // Broadcast to the receiver's personal room
        io.to(`user:${receiverId}`).emit('dm:message', message);
        // Bounce it back to the sender so their UI updates instantly
        socket.emit('dm:message', message);
        
      } catch (err) {
        logger.error(`dm:send error: ${err.message}`);
        socket.emit('error', 'Failed to send direct message');
      }
    });

    // ── TYPING INDICATOR ────────────────────────────────────────────────────
    socket.on('chat:typing', ({ classroomId, isTyping }) => {
      socket.to(`classroom:${classroomId}`).emit('chat:typing', { userId, name, isTyping });
    });

    // ── DISCONNECT ──────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      const rooms = [...socket.rooms].filter(r => r.startsWith('classroom:'));
      for (const room of rooms) {
        const classroomId = room.replace('classroom:', '');
        await redis.srem(`classroom:${classroomId}:online`, userId).catch(() => {});
        const onlineIds = await redis.smembers(`classroom:${classroomId}:online`).catch(() => []);
        io.to(room).emit('presence:update', onlineIds);
      }
      await redis.del(`session:${userId}`).catch(() => {});
    });
  });
};