/**
 * Script de création d'un administrateur.
 * Usage : node src/scripts/createAdmin.js <email> <password> <prénom> <nom> [roleAdmin]
 * Rôle admin : super | manager | moderator (défaut : super)
 */
const readline = require('readline');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const { User, Admin } = require('../models');
const { ROLES } = require('../constants');
const logger = require('../config/logger');

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

async function main() {
  const [email, password, firstName, lastName, roleAdmin = 'super'] = process.argv.slice(2);

  const finalEmail = email || (await ask('E-mail de l\'administrateur : '));
  const finalPassword = password || (await ask('Mot de passe (min 8, maj/min/chiffre) : '));
  const finalFirst = firstName || (await ask('Prénom : '));
  const finalLast = lastName || (await ask('Nom : '));

  if (!['super', 'manager', 'moderator'].includes(roleAdmin)) {
    throw new Error('Rôle admin invalide (super | manager | moderator)');
  }

  await connectDatabase();

  const existing = await User.findOne({ email: finalEmail });
  if (existing) {
    logger.error(`Un utilisateur existe déjà avec l'e-mail ${finalEmail}`);
    process.exit(1);
  }

  const user = await User.create({
    email: finalEmail,
    password: finalPassword,
    role: ROLES.ADMIN,
    firstName: finalFirst,
    lastName: finalLast,
    isEmailVerified: true,
    accountStatus: 'active',
  });

  await Admin.create({
    userId: user._id,
    roleAdmin,
    permissions: {
      statistics: roleAdmin === 'super',
      settings: roleAdmin === 'super',
      quotes: roleAdmin === 'super',
      ...(roleAdmin === 'moderator'
        ? { users: false, categories: false, reports: true, reviews: true, artisans: false }
        : {}),
    },
  });

  logger.info(`Administrateur créé : ${finalEmail} (${roleAdmin})`);
  await disconnectDatabase();
}

main().catch(async (error) => {
  logger.error('Échec :', error.message);
  process.exit(1);
});
