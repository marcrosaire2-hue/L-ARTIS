/**
 * Tests d'intégration Phase 4 — API métier (bout en bout, idempotent).
 * Prérequis : serveur démarré + admin@test.dev / MotdePasse1 créé.
 * Usage : node /tmp/opencode/test-p4.mjs
 */
import mongoose from 'mongoose';
import { config } from 'dotenv';
import FormData from 'form-data';
config();

const BASE = 'http://localhost:5000/api/v1';
const MONGODB_URI = process.env.MONGODB_URI;

let passed = 0, failed = 0;
const results = [];
const check = (name, cond, extra = '') => {
  if (cond) { passed++; results.push(`✓ ${name}`); }
  else { failed++; results.push(`✗ ${name} ${extra}`); }
};

async function api(method, path, { token, json, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (json !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: form || (json !== undefined ? JSON.stringify(json) : undefined),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function cleanup() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({
    email: { $regex: '@test.dev$', $not: /^admin@test\.dev$/ },
  }).toArray();
  const ids = users.map((u) => u._id);
  if (ids.length) {
    await db.collection('users').deleteMany({ _id: { $in: ids } });
    await db.collection('artisans').deleteMany({ userId: { $in: ids } });
    await db.collection('clients').deleteMany({ userId: { $in: ids } });
    await db.collection('sessions').deleteMany({ user: { $in: ids } });
  }
  for (const c of ['artisans', 'services', 'quotes', 'reviews', 'favorites', 'galleries', 'notifications', 'media', 'reports']) {
    await db.collection(c).deleteMany({});
  }
  await mongoose.disconnect();
}

await cleanup();
console.log('Nettoyage initial terminé');

const stamp = Date.now();
const clientEmail = `c${stamp}@test.dev`;
const artisanEmail = `a${stamp}@test.dev`;
const businessName = `Paul Électricité ${stamp}`;

// ---------- Comptes ----------
await api('POST', '/auth/register', { json: { email: clientEmail, password: 'MotdePasse1', firstName: 'Claire', lastName: 'Hounsou', phone: '+22990111111', role: 'client' } });
const clientLogin = await api('POST', '/auth/login', { json: { email: clientEmail, password: 'MotdePasse1' } });
const clientToken = clientLogin.body.data.accessToken;
check('0. Connexion client', !!clientToken, JSON.stringify(clientLogin.body).slice(0, 100));

const artisanReg = await api('POST', '/auth/register', { json: {
  email: artisanEmail, password: 'MotdePasse1', firstName: 'Paul', lastName: 'Agossou', phone: '+22990222222', role: 'artisan',
  artisanData: { businessName, department: 'Littoral', commune: 'Cotonou', district: 'Akpakpa', skills: ['electricite', 'domotique'] },
}});
check('1. Inscription artisan', artisanReg.status === 201, `(${artisanReg.status} ${JSON.stringify(artisanReg.body).slice(0, 100)})`);
await api('POST', '/auth/verify-email', { json: { token: artisanReg.body.data.dev.verificationToken } });
const artisanLogin = await api('POST', '/auth/login', { json: { email: artisanEmail, password: 'MotdePasse1' } });
const artisanToken = artisanLogin.body.data.accessToken;

// ---------- Catégories publiques ----------
let r = await api('GET', '/categories');
check('2. Liste catégories (12)', r.status === 200 && r.body.data.length === 12, `(${r.status}, ${r.body.data?.length})`);
r = await api('GET', '/categories/electricite');
check('3. Détail catégorie + métiers', r.status === 200 && r.body.data.trades.length >= 3, `(${r.status})`);
const tradeId = r.body.data.trades[0]._id;

// ---------- Recherche (pas encore validé) ----------
r = await api('GET', '/artisans?q=electricite');
check('4. Recherche : aucun résultat (pending)', r.status === 200 && r.body.data.totalItems === 0, `(${r.body.data?.totalItems})`);

// ---------- Admin : validation ----------
const adminLogin = await api('POST', '/auth/login', { json: { email: 'admin@test.dev', password: 'MotdePasse1' } });
const adminToken = adminLogin.body.data.accessToken;
check('4b. Connexion admin', !!adminToken);
r = await api('GET', '/admin/artisans?status=pending', { token: adminToken });
check('5. Admin : liste pending', r.status === 200 && r.body.data.items.length >= 1, `(${r.status})`);
const pending = r.body.data.items.find((a) => a.displayName === businessName);
check('5a. Artisan trouvé dans la liste', !!pending);
r = await api('PUT', `/admin/artisans/${pending._id}/status`, { token: adminToken, json: { status: 'validated' } });
check('5b. Validation artisan', r.status === 200 && r.body.data.status === 'validated', `(${r.status})`);

// ---------- Recherche après validation ----------
r = await api('GET', '/artisans?q=electricite');
check('6. Recherche texte trouvée', r.body.data.totalItems >= 1, `(${r.body.data?.totalItems})`);
const artisanId = r.body.data.items[0].artisanId;
r = await api('GET', '/artisans?department=Littoral&commune=Cotonou');
check('6b. Filtre département+commune', r.body.data.totalItems >= 1);
r = await api('GET', '/artisans?sort=rating&page=1&limit=5');
check('6d. Pagination', r.status === 200 && r.body.data.items.length <= 5 && typeof r.body.data.totalPages === 'number');

// ---------- Fiche publique ----------
r = await api('GET', `/artisans/${artisanId}`);
check('7. Fiche publique', r.status === 200 && r.body.data.artisan.artisanId === artisanId, `(${r.status})`);
const artisanDbId = r.body.data.artisan._id;

// ---------- Profil propriétaire ----------
r = await api('PUT', '/artisans/me/profile', { token: artisanToken, json: { bio: 'Électricien certifié depuis 2012', tagline: 'Travail soigné', yearsExperience: 12, availability: { isAvailable: true }, 'pricing.fromPrice': 5000, trades: [tradeId] } });
check('8. Mise à jour profil', r.status === 200 && r.body.data.artisan.bio.includes('certifié'), `(${r.status})`);
r = await api('GET', '/artisans/me', { token: artisanToken });
check('8b. GET profil propriétaire', r.status === 200);

// ---------- Recherche par métier (après ajout du métier au profil) ----------
r = await api('GET', '/artisans?trade=' + tradeId);
check('6c. Filtre métier', r.status === 200 && r.body.data.totalItems >= 1, `(${r.body.data?.totalItems})`);

// ---------- Services ----------
r = await api('POST', '/artisans/me/services', { token: artisanToken, json: { title: 'Installation électrique complète', description: 'Mise aux normes, tableau, prises', price: 25000, priceUnit: 'forfait', durationMin: 240 } });
check('9. Création service', r.status === 201, `(${r.status})`);
const serviceId = r.body.data._id;
r = await api('GET', '/artisans/me/services', { token: artisanToken });
check('9b. Liste services', r.body.data.length === 1);
r = await api('PUT', `/artisans/services/${serviceId}`, { token: artisanToken, json: { price: 30000 } });
check('9c. Mise à jour service', r.body.data.price === 30000);
r = await api('GET', `/artisans/${artisanId}`);
check('9d. Service visible sur fiche publique', r.body.data.services.length === 1);

// ---------- Upload média ----------
const TINY_JPEG = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==', 'base64');
const fd = new FormData();
fd.append('file', TINY_JPEG, { filename: 'photo.jpg', contentType: 'image/jpeg' });
const upRes = await fetch(`${BASE}/uploads`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${artisanToken}`, ...fd.getHeaders() },
  body: fd.getBuffer(),
});
const up = await upRes.json();
check('10. Upload image', upRes.status === 201 && up.data.url.startsWith('https://res.cloudinary.com'), `(${upRes.status}, ${JSON.stringify(up).slice(0, 120)})`);

// ---------- Devis ----------
r = await api('POST', '/quotes', { token: clientToken, json: { artisanId: artisanDbId, serviceId, title: 'Rénovation tableau électrique', description: 'Mon tableau est ancien, je veux une mise aux normes complète de la maison', budget: { min: 20000, max: 50000 }, location: { commune: 'Cotonou', district: 'Fidjrossè' } } });
check('11. Création devis client', r.status === 201 && r.body.data.status === 'pending', `(${r.status})`);
const quoteId = r.body.data._id;
r = await api('GET', '/artisans/me/quotes', { token: artisanToken });
check('11b. Devis visible côté artisan', r.body.data.totalItems === 1);
r = await api('PUT', `/quotes/${quoteId}/respond`, { token: artisanToken, json: { status: 'accepted', price: 35000, durationDays: 3, message: 'Je peux passer la semaine prochaine' } });
check('11c. Acceptation artisan', r.status === 200 && r.body.data.status === 'accepted', `(${r.status})`);
r = await api('GET', '/quotes/me', { token: clientToken });
check('11d. Statut vu côté client', r.body.data.items[0].status === 'accepted');
r = await api('PUT', `/quotes/${quoteId}/status`, { token: clientToken, json: { status: 'completed' } });
check('11e. Devis terminé (client)', r.status === 200 && r.body.data.status === 'completed', `(${r.status})`);

// ---------- Avis ----------
r = await api('POST', '/reviews', { token: clientToken, json: { quoteId, rating: 5, comment: 'Travail impeccable, très ponctuel !' } });
check('12. Création avis (après devis terminé)', r.status === 201 && r.body.data.status === 'pending', `(${r.status})`);
r = await api('GET', `/artisans/${artisanId}/reviews`);
check('12b. Avis pas encore visible (modération)', r.body.data.totalItems === 0);
const adminReviews = await api('GET', '/admin/reviews?status=pending', { token: adminToken });
const reviewId = adminReviews.body.data.items[0]._id;
r = await api('PUT', `/admin/reviews/${reviewId}/status`, { token: adminToken, json: { status: 'approved' } });
check('12c. Approbation admin', r.status === 200, `(${r.status})`);
r = await api('GET', `/artisans/${artisanId}/reviews`);
check('12d. Avis publié + note recalculée', r.body.data.totalItems === 1);
r = await api('GET', '/artisans?minRating=4');
const rated = r.body.data.items.find((a) => a.artisanId === artisanId);
check('12e. Filtre note min', !!rated && rated.rating.average === 5, JSON.stringify(rated?.rating));

// ---------- Réponse artisan à l'avis ----------
r = await api('PUT', `/reviews/${reviewId}/reply`, { token: artisanToken, json: { text: 'Merci beaucoup pour votre confiance !' } });
check('12f. Réponse artisan à l\'avis', r.status === 200 && !!r.body.data.reply?.text, `(${r.status})`);

// ---------- Favoris ----------
r = await api('POST', '/favorites', { token: clientToken, json: { artisanId: artisanDbId } });
check('13. Ajout favori', r.status === 201, `(${r.status})`);
r = await api('POST', '/favorites', { token: clientToken, json: { artisanId: artisanDbId } });
check('13b. Doublon favori -> 409', r.status === 409, `(${r.status})`);
r = await api('GET', '/favorites/me', { token: clientToken });
check('13c. Liste favoris', r.body.data.totalItems === 1);
r = await api('DELETE', `/favorites/${artisanDbId}`, { token: clientToken });
check('13d. Retrait favori', r.status === 200, `(${r.status})`);

// ---------- Sécurité rôles ----------
r = await api('GET', '/admin/users', { token: clientToken });
check('14. Client bloqué sur /admin -> 403', r.status === 403, `(${r.status})`);
r = await api('POST', '/quotes', { token: artisanToken, json: { artisanId: artisanDbId, title: 'X', description: 'Un artisan ne peut pas créer de devis' } });
check('14b. Artisan bloqué création devis -> 403', r.status === 403, `(${r.status})`);
r = await api('GET', '/artisans/me', { token: clientToken });
check('14c. Client bloqué profil artisan -> 403', r.status === 403, `(${r.status})`);

// ---------- Stats artisan ----------
r = await api('GET', '/artisans/me/stats', { token: artisanToken });
check('15. Stats tableau de bord', r.status === 200 && r.body.data.quotes.completed === 1 && r.body.data.reviewsCount === 1, `(${r.status}, ${JSON.stringify(r.body.data?.quotes)})`);

// ---------- Suspension utilisateur par admin ----------
const users = await api('GET', '/admin/users?role=client', { token: adminToken });
const clientUser = users.body.data.items.find((u) => u.email === clientEmail);
r = await api('PUT', `/admin/users/${clientUser._id}/status`, { token: adminToken, json: { status: 'suspended', reason: 'Comportement inapproprié' } });
check('16. Suspension client par admin', r.status === 200, `(${r.status})`);
r = await api('GET', '/auth/me', { token: clientToken });
check('16b. Client suspendu bloqué -> 403', r.status === 403, `(${r.status})`);
r = await api('PUT', `/admin/users/${clientUser._id}/status`, { token: adminToken, json: { status: 'active' } });
check('16c. Réactivation', r.status === 200, `(${r.status})`);

// ---------- Nettoyage final ----------
await cleanup();
console.log('Nettoyage final terminé');

console.log(results.join('\n'));
console.log(`\n=== RÉSULTAT : ${passed} réussis, ${failed} échecs ===`);
process.exit(failed ? 1 : 0);
