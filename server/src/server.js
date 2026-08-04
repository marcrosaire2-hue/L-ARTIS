/**
 * Point d'entrée du serveur.
 * 1. Connexion à MongoDB
 * 2. Démarrage HTTP + Socket.IO
 * 3. Arrêt propre sur SIGINT/SIGTERM
 */
const http = require('http');
const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { initRealtime } = require('./services/realtime.service');

let server;

async function startServer() {
  try {
    await connectDatabase();

    server = http.createServer(app);
    initRealtime(server);

    server.listen(env.port, () => {
      logger.info(`API démarrée : http://localhost:${env.port}${env.apiPrefix}`);
    });

    app.set('trust proxy', env.isProduction ? 1 : 0);
  } catch (error) {
    logger.error('Démarrage impossible :', error.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  logger.warn(`${signal} reçu, arrêt propre en cours...`);
  if (server) {
    server.close(async () => {
      await disconnectDatabase();
      logger.info('Serveur arrêté');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error('Promesse non gérée :', reason);
  shutdown('unhandledRejection');
});
process.on('uncaughtException', (error) => {
  logger.error('Exception non capturée :', error.message, { stack: error.stack });
  shutdown('uncaughtException');
});

startServer();
