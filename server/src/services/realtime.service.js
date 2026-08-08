/**
 * Temps réel via Socket.IO — rooms par utilisateur authentifié.
 */
const { Server } = require('socket.io');
const logger = require('../config/logger');
const env = require('../config/env');
const { verifyAccessToken } = require('./token.service');

let io = null;

function initRealtime(httpServer) {
  if (io) return io;

  const origins = [
    env.clientUrl,
    env.adminUrl,
    env.mobileWebUrl,
    'https://lartis-client-fx8k.onrender.com',
    'https://lartis-admin-jmii.onrender.com',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:8081',
  ]
    .map((u) => (u || '').trim().replace(/\/$/, ''))
    .filter(Boolean);

  io = new Server(httpServer, {
    cors: {
      origin: origins,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization || '').replace(/^Bearer\s+/i, '');
      if (!token) return next(new Error('Authentification requise'));
      const payload = verifyAccessToken(token);
      socket.userId = payload.sub;
      return next();
    } catch (error) {
      return next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket) => {
    const room = `user:${socket.userId}`;
    socket.join(room);
    logger.debug(`Socket connecté : ${socket.userId}`);
    socket.on('disconnect', () => {
      logger.debug(`Socket déconnecté : ${socket.userId}`);
    });
  });

  logger.info('Socket.IO initialisé');
  return io;
}

function emitToUser(userId, event, payload) {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit(event, payload);
}

function getIO() {
  return io;
}

module.exports = { initRealtime, emitToUser, getIO };
