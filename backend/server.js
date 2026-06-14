/**
 * Virtual Classroom V2 — Server Entry Point
 * Express + Socket.io + Prisma + Mongoose + Redis Adapter + Yjs Collaboration
 * @module server
 */

import 'express-async-errors';
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

// ── Config / Infrastructure ──────────────────────────────────────
import connectMongoDB from './config/db.js';
import prisma from './config/prisma.js';
import redis from './config/redis.js';
import { ensureBucketExists } from './config/minio.js';
import logger from './utils/logger.js';

// ── Middleware ───────────────────────────────────────────────────
import { verifyToken, syncDbUser } from './middleware/auth.js';
import { checkRole } from './middleware/rbac.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

// ── Routes ───────────────────────────────────────────────────────
import userRoutes        from './routes/userRoutes.js';
import classroomRoutes   from './routes/classroomRoutes.js';
import assignmentRoutes  from './routes/assignmentRoutes.js';
import testRoutes        from './routes/testRoutes.js';
import materialRoutes    from './routes/materialRoutes.js';
import chatRoutes        from './routes/chatRoutes.js';
import adminRoutes       from './routes/adminRoutes.js';

// ── Collaboration ─────────────────────────────────────────────────
import { initCollaborationServer } from './collaboration/yjsServer.js';

// ── Socket Handlers ───────────────────────────────────────────────
import { registerSocketHandlers } from './sockets/socketHandlers.js';

// ── App Setup ────────────────────────────────────────────────────
const app = express();

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

app.use(cors({
  origin: [CORS_ORIGIN, 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ── Public Health Endpoint (no auth) ─────────────────────────────
app.get('/health', (_req, res) =>
  res.status(200).json({ status: 'ok', timestamp: new Date() })
);

// ── Common Auth Middleware for /api/v2 ───────────────────────────
const auth = [verifyToken, syncDbUser];

// ── API Routes ────────────────────────────────────────────────────
app.use('/api/v2/users',   ...auth, userRoutes);
app.use('/api/v2/admin',   ...auth, checkRole(['ADMIN']), adminRoutes);

app.use('/api/v2/classrooms', ...auth, classroomRoutes);

// Nested routes
app.use('/api/v2/classrooms/:classroomId/assignments', ...auth, assignmentRoutes);
app.use('/api/v2/classrooms/:classroomId/tests',       ...auth, testRoutes);
app.use('/api/v2/classrooms/:classroomId/materials',   ...auth, materialRoutes);
app.use('/api/v2/classrooms/:classroomId/chat',        ...auth, chatRoutes);

// Submission download
app.get('/api/v2/submissions/:submissionId/download', ...auth,
  async (req, res, next) => {
    const { getSubmissionDownloadUrl } = await import('./controllers/submissionController.js');
    return getSubmissionDownloadUrl(req, res, next);
  }
);

// ── HTTP Server ──────────────────────────────────────────────────
const server = http.createServer(app);

// ── Socket.io Setup ──────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: [CORS_ORIGIN, 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

// ── Yjs Collaboration Setup ──────────────────────────────────────
const yjsWss = initCollaborationServer();

// 🔥 THE BULLETPROOF TRAFFIC COP 🔥
// 1. Remove the default greedy listener Socket.io adds to the server
server.removeAllListeners('upgrade');

// 2. Manually handle the 101 Switching Protocols upgrade for EVERY connection
server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/collaboration')) {
    // Route to Monaco Workspace
    yjsWss.handleUpgrade(req, socket, head, (ws) => {
      yjsWss.emit('connection', ws, req);
    });
  } else if (req.url.startsWith('/socket.io')) {
    // Route to Chat & Notifications
    io.engine.handleUpgrade(req, socket, head);
  } else {
    // Kill unknown connections
    socket.destroy();
  }
});

// ── Error Handler (must be last) ─────────────────────────────────
app.use(errorHandler);

// ── Startup ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 8000;

async function start() {
  try {
    await prisma.$connect();
    logger.info('✅ PostgreSQL (Prisma) connected');

    await connectMongoDB();

    try {
      const pubClient = redis.duplicate();
      const subClient = redis.duplicate();
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('✅ Socket.io Redis adapter attached');
    } catch (redisErr) {
      logger.warn('⚠️  Redis unavailable — Socket.io running in single-process mode');
    }

    await ensureBucketExists();

    registerSocketHandlers(io);

    server.listen(PORT, () => {
      logger.info(`🚀 Server running at http://localhost:${PORT}`);
      logger.info(`   Health:   http://localhost:${PORT}/health`);
      logger.info(`   API base: http://localhost:${PORT}/api/v2`);
    });
  } catch (err) {
    logger.error('❌ Startup failed', { message: err.message, stack: err.stack });
    process.exit(1);
  }
}

start();