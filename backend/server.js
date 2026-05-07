'use strict';

require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./src/config/db');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 5000;

// ── Create HTTP Server ─────────────────────────────────────────────────────
const server = http.createServer(app);

// ── Initialize Socket.IO ───────────────────────────────────────────────────
// ✅ FIX: دعم CORS في production و development سوا
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.APP_BASE_URL].filter(Boolean)
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  allowEIO3: true,
});

// ✅ تخزين io في app عشان نقدر ننادي عليه من الـ Controllers والـ Routes
app.set('socketio', io);

// ── Socket Events ──────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  // انضمام العميل لغرفة خاصة بالأوردر (Room)
  socket.on('joinOrderRoom', (orderId) => {
    socket.join(orderId);
    logger.info(`[Socket] Client joined order room: ${orderId}`);
  });

  // ✅ FIX: إضافة handler لمغادرة الغرفة (كان ناقص)
  socket.on('leaveOrderRoom', (orderId) => {
    socket.leave(orderId);
    logger.info(`[Socket] Client left order room: ${orderId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ── Graceful shutdown handler ──────────────────────────────────────────────
const shutdown = (signal) => {
  logger.info(`[Server] ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('[Server] HTTP and Socket server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ── Unhandled rejection / exception guards ─────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  logger.error('[Server] Unhandled Rejection:', { reason, promise });
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('[Server] Uncaught Exception:', { message: err.message, stack: err.stack });
  process.exit(1);
});

// ── Bootstrap ──────────────────────────────────────────────────────────────
(async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      logger.info(`[Server] A.E.E Backend & Socket.IO running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    logger.error('[Server] Failed to connect to DB:', { message: err.message });
    process.exit(1);
  }
})();
