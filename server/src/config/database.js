/**
 * Connexion MongoDB via Mongoose.
 * Gère les événements de connexion et les logs associés.
 */
const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

const options = {
  serverSelectionTimeoutMS: 15000,
  maxPoolSize: 10,
};

async function connectDatabase() {
  try {
    await mongoose.connect(env.mongoUri, options);
    logger.info(`MongoDB connecté : ${mongoose.connection.host}`);
  } catch (error) {
    logger.error('Échec de la connexion MongoDB :', error.message);
    throw error;
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB déconnecté');
  });

  mongoose.connection.on('error', (error) => {
    logger.error('Erreur MongoDB :', error.message);
  });

  return mongoose.connection;
}

async function disconnectDatabase() {
  await mongoose.disconnect();
  logger.info('MongoDB déconnecté proprement');
}

module.exports = { connectDatabase, disconnectDatabase };
