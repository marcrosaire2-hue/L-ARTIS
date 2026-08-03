/**
 * Service e-mail : transport Nodemailer.
 * - En production : SMTP configuré (env).
 * - En développement sans SMTP : les e-mails sont journalisés (log file)
 *   et les tokens sont exposés dans la réponse API (champ `dev`) par le
 *   contrôleur pour faciliter le développement frontend.
 */
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const logger = require('../config/logger');

let transporter = null;

if (env.smtp.host && env.smtp.user) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
}

const emailLogDir = path.resolve(__dirname, '../../logs/emails');

/**
 * Envoie un e-mail (ou le journalise en dev sans SMTP).
 */
async function sendEmail({ to, subject, html, text = '' }) {
  const payload = { from: env.smtp.from, to, subject, html, text };

  if (transporter) {
    try {
      await transporter.sendMail(payload);
      logger.info(`E-mail envoyé à ${to} : ${subject}`);
      return;
    } catch (error) {
      logger.error(`Échec d'envoi e-mail à ${to} : ${error.message}`);
      throw error;
    }
  }

  // Dev : journalisation locale
  fs.mkdirSync(emailLogDir, { recursive: true });
  const filename = `${Date.now()}-${to.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
  fs.writeFileSync(path.join(emailLogDir, filename), JSON.stringify(payload, null, 2));
  logger.info(`[DEV] E-mail (journalisé) à ${to} : ${subject}`);
}

module.exports = { sendEmail };
