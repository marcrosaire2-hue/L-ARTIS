/**
 * Migration : le téléphone devient l'identifiant de connexion.
 *
 * 1. Normalise en E.164 tous les numéros déjà enregistrés.
 * 2. Signale les doublons que la nouvelle contrainte d'unicité rejetterait.
 * 3. Remplace l'ancien index unique `email` par des index PARTIELS sur
 *    `phone` et `email` (un index unique classique ferait collisionner tous
 *    les comptes dépourvus du champ).
 *
 * Idempotent : relançable sans risque.
 * Lancer : npm run migrate:phone
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const logger = require('../config/logger');
const { User } = require('../models');
const { normalizePhone, isValidPhone } = require('../utils/phone');

/**
 * Reprend la renumérotation béninoise de 2020 : les anciens numéros à
 * 8 chiffres ont été prolongés par un préfixe « 01 ». Sans cette conversion,
 * un compte créé avant la bascule échoue désormais à la validation et devient
 * impossible à modifier (suspension, changement de mot de passe...).
 */
function upgradeLegacyBenin(e164) {
  const match = /^\+229(\d{8})$/.exec(e164);
  return match ? `+22901${match[1]}` : e164;
}

async function run() {
  await mongoose.connect(env.mongoUri);
  const collection = mongoose.connection.collection('users');

  /* --- 1. Normalisation des numéros existants --- */
  const users = await collection.find({}, { projection: { phone: 1, email: 1, role: 1 } }).toArray();
  let normalized = 0;
  const seen = new Map();
  const duplicates = [];
  const missing = [];

  for (const user of users) {
    if (!user.phone) {
      missing.push({ _id: user._id, email: user.email, role: user.role });
      continue;
    }
    const canonical = upgradeLegacyBenin(normalizePhone(user.phone));

    if (seen.has(canonical)) {
      duplicates.push({ phone: canonical, ids: [seen.get(canonical), user._id] });
    } else {
      seen.set(canonical, user._id);
    }

    if (canonical !== user.phone) {
      await collection.updateOne({ _id: user._id }, { $set: { phone: canonical } });
      normalized += 1;
    }
    if (!isValidPhone(canonical)) {
      logger.warn(`Numéro invalide après normalisation : ${canonical} (${user._id})`);
    }
  }

  logger.info(`Numéros normalisés : ${normalized} / ${users.length}`);
  if (missing.length) {
    logger.warn(
      `${missing.length} compte(s) sans téléphone (non bloquant, l'index est partiel) : ` +
        missing.map((u) => `${u.email ?? u._id} [${u.role}]`).join(', ')
    );
  }
  if (duplicates.length) {
    // On n'arbitre pas automatiquement : fusionner deux comptes est une
    // décision métier, pas une opération de migration.
    logger.error(
      `${duplicates.length} doublon(s) de numéro — la contrainte d'unicité échouera. ` +
        'Traitez-les manuellement avant de relancer.'
    );
    duplicates.forEach((d) => logger.error(`  ${d.phone} : ${d.ids.join(' et ')}`));
    await mongoose.disconnect();
    process.exit(1);
  }

  /* --- 2. Index : l'ancien `email_1` unique doit disparaître --- */
  const before = await collection.indexes();
  logger.info(`Index avant : ${before.map((i) => i.name).join(', ')}`);

  await User.syncIndexes();

  const after = await collection.indexes();
  logger.info(`Index après : ${after.map((i) => i.name).join(', ')}`);

  const partial = after.filter((i) => i.partialFilterExpression);
  logger.info(`Index partiels en place : ${partial.map((i) => i.name).join(', ') || 'aucun'}`);

  await mongoose.disconnect();
}

run().catch(async (error) => {
  logger.error('Échec de la migration :', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
