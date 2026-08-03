/**
 * Détection des comptes en double.
 *
 * L'index unique sur `User.phone` empêche déjà deux comptes de partager le
 * même identifiant de connexion. Les doublons qui subsistent sont donc ceux
 * qui passent à côté de cet index — et ce sont les seuls qui comptent
 * vraiment : une même personne ou une même entreprise derrière plusieurs
 * comptes, chacun avec son propre numéro parfaitement vérifiable.
 *
 * Aucun signal ne suffit seul : le script les additionne et classe les
 * groupes par force de présomption, sans jamais fusionner ni supprimer.
 * Rapprocher deux comptes est une décision humaine.
 *
 * Lancer : npm run check:duplicates
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const { User, Artisan, Media, Session } = require('../models');
const { normalizePhone } = require('../utils/phone');

/* Regroupe des documents par une clé, en ne gardant que les collisions. */
function collisions(docs, keyOf) {
  const groups = new Map();
  for (const doc of docs) {
    const key = keyOf(doc);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(doc);
  }
  return [...groups.entries()].filter(([, list]) => list.length > 1);
}

/* Poids de chaque signal : un indice faible seul ne doit rien déclencher. */
const SIGNALS = {
  contactPhone: { weight: 40, label: 'même numéro de contact public' },
  whatsapp: { weight: 40, label: 'même numéro WhatsApp' },
  photo: { weight: 35, label: 'même photo (identifiant Cloudinary)' },
  contactEmail: { weight: 25, label: 'même e-mail de contact' },
  identity: { weight: 20, label: 'mêmes nom, prénom et commune' },
  registrationIp: { weight: 15, label: 'inscrit depuis la même adresse IP' },
  legacyCollision: { weight: 50, label: 'numéros fusionnés par la renumérotation 2020' },
};

async function run() {
  await mongoose.connect(env.mongoUri);

  const users = await User.find({ role: { $ne: 'admin' } })
    .select('firstName lastName phone email role createdAt')
    .lean();
  const artisans = await Artisan.find({})
    .select('userId artisanId displayName contactPhone contactEmail socialLinks location')
    .lean();
  const medias = await Media.find({}).select('uploadedBy publicId url').lean();
  const sessions = await Session.find({}).select('user ip').lean();

  const userById = new Map(users.map((u) => [String(u._id), u]));
  const suspicions = new Map(); // clé de paire -> { score, raisons }

  const flag = (aId, bId, signal) => {
    if (aId === bId) return;
    const key = [aId, bId].sort().join('|');
    if (!suspicions.has(key)) suspicions.set(key, { score: 0, reasons: [] });
    const entry = suspicions.get(key);
    entry.score += SIGNALS[signal].weight;
    entry.reasons.push(SIGNALS[signal].label);
  };

  const pairsFrom = (list, idOf, signal) => {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) flag(idOf(list[i]), idOf(list[j]), signal);
    }
  };

  /* --- Signaux portés par la fiche artisan --- */
  const artisanUser = (a) => String(a.userId);

  for (const [, group] of collisions(artisans, (a) => normalizePhone(a.contactPhone))) {
    pairsFrom(group, artisanUser, 'contactPhone');
  }
  for (const [, group] of collisions(artisans, (a) => normalizePhone(a.socialLinks?.whatsapp))) {
    pairsFrom(group, artisanUser, 'whatsapp');
  }
  for (const [, group] of collisions(artisans, (a) => a.contactEmail?.toLowerCase())) {
    pairsFrom(group, artisanUser, 'contactEmail');
  }

  /* --- Même image réutilisée : signal fort, difficile à contourner --- */
  for (const [, group] of collisions(medias, (m) => m.publicId || m.url)) {
    pairsFrom(group, (m) => String(m.uploadedBy), 'photo');
  }

  /* --- Identité déclarée --- */
  const communeOf = new Map(artisans.map((a) => [String(a.userId), a.location?.commune ?? '']));
  for (const [, group] of collisions(users, (u) => {
    const nom = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim().toLowerCase();
    return nom ? `${nom}|${communeOf.get(String(u._id)) ?? ''}` : null;
  })) {
    pairsFrom(group, (u) => String(u._id), 'identity');
  }

  /* --- Empreinte d'inscription : IP partagée --- */
  for (const [, group] of collisions(sessions, (s) => (s.ip && s.ip !== '::1' ? s.ip : null))) {
    const uniques = [...new Set(group.map((s) => String(s.user)))];
    if (uniques.length > 1) pairsFrom(uniques, (id) => id, 'registrationIp');
  }

  /* --- Piège propre à la migration 2020 --- */
  // Un ancien numéro à 8 chiffres devient +22901XXXXXXXX : il peut alors
  // entrer en collision avec un compte déjà créé au nouveau format.
  for (const [, group] of collisions(users, (u) => {
    const m = /^\+229(\d{8})$/.exec(u.phone ?? '');
    return m ? `+22901${m[1]}` : u.phone;
  })) {
    pairsFrom(group, (u) => String(u._id), 'legacyCollision');
  }

  /* --- Restitution --- */
  const classés = [...suspicions.entries()]
    .map(([key, v]) => ({ ids: key.split('|'), ...v }))
    .filter((s) => s.score >= 35)
    .sort((a, b) => b.score - a.score);

  const decrire = (id) => {
    const u = userById.get(id);
    const a = artisans.find((x) => String(x.userId) === id);
    if (!u) return `compte supprimé (${id})`;
    return `${u.firstName} ${u.lastName} · ${u.phone}${a ? ` · « ${a.displayName} »` : ''} · ${u.role}`;
  };

  console.log(`\nComptes analysés : ${users.length} (dont ${artisans.length} artisans)`);
  console.log(`Rapprochements retenus : ${classés.length}\n`);

  if (!classés.length) {
    console.log('Aucun doublon présumé.');
  }

  for (const s of classés) {
    const niveau = s.score >= 70 ? 'ÉLEVÉE' : s.score >= 50 ? 'MOYENNE' : 'FAIBLE';
    console.log(`[présomption ${niveau} — ${s.score} pts]`);
    s.ids.forEach((id) => console.log(`   ${decrire(id)}`));
    console.log(`   motifs : ${[...new Set(s.reasons)].join(', ')}\n`);
  }

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('Échec :', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
