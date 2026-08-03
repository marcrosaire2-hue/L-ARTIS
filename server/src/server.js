/**
 * Point d'entrée du serveur.
 * 1. Connexion à MongoDB
 * 2. Démarrage HTTP (ou HTTPS en production derrière un proxy)
 * 3. Arrêt propre sur SIGINT/SIGTERM
 */
const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { connectDatabase, disconnectDatabase } = require('./config/database');

let server;

async function startServer() {
  try {
    await connectDatabase();

    server = app.listen(env.port, () => {
      logger.info(`API démarrée : http://localhost:${env.port}${env.apiPrefix}`);
    });

    // Durcissement derrière un reverse proxy (Nginx) en production
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
    // Garde-fou : forcer la sortie après 10 s
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
