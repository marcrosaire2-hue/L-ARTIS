/**
 * Vérifie la connexion MongoDB et le volume d'artisans indexés.
 *
 * Lancer : npm run check:search
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const { Artisan } = require('../models');

async function run() {
  await mongoose.connect(env.mongoUri);
  const count = await Artisan.countDocuments();
  console.log(`ok — ${count} artisan${count > 1 ? 's' : ''} indexé${count > 1 ? 's' : ''}`);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('Échec :', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
