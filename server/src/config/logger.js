/**
 * Logger centralisé basé sur Winston.
 * - Console : tous niveaux (développement)
 * - Fichiers journaliers avec rotation (production)
 * Niveaux : error > warn > info > http > debug
 */
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const env = require('./env');

const logDir = path.resolve(__dirname, '../logs');

const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`)
  ),
});

const fileTransport = new DailyRotateFile({
  dirname: logDir,
  filename: 'app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '10m',
  maxFiles: '14d',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  level: env.isProduction ? 'info' : 'debug',
});

const logger = winston.createLogger({
  level: env.isProduction ? 'info' : 'debug',
  transports: [consoleTransport, fileTransport],
});

module.exports = logger;
