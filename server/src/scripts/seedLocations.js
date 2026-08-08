/**
 * Seed UNIQUEMENT la géographie du Bénin (départements / communes / quartiers).
 * Utile sur Render quand la collection Location est vide :
 *   node src/scripts/seedLocations.js
 */
const logger = require('../config/logger');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const { Location } = require('../models');
const ARRONDISSEMENTS_BY_COMMUNE = require('../seeders/arrondissements.json');

async function upsertLocation(base) {
  await Location.findOneAndUpdate(base, { $setOnInsert: { ...base, isActive: true } }, { upsert: true });
}

async function seedLocations() {
  await connectDatabase();

  let communes = 0;
  let districts = 0;

  for (const department of Object.keys(ARRONDISSEMENTS_BY_COMMUNE)) {
    for (const commune of Object.keys(ARRONDISSEMENTS_BY_COMMUNE[department])) {
      await upsertLocation({
        country: 'Bénin',
        countryCode: 'BJ',
        department,
        commune,
        district: '',
      });
      communes += 1;

      for (const district of ARRONDISSEMENTS_BY_COMMUNE[department][commune]) {
        if (!district) continue;
        await upsertLocation({
          country: 'Bénin',
          countryCode: 'BJ',
          department,
          commune,
          district,
        });
        districts += 1;
      }
    }
  }

  const total = await Location.countDocuments();
  logger.info(
    `Géographie seedée : ${communes} communes, ${districts} quartiers/arrondissements, ${total} documents Location.`
  );

  await disconnectDatabase();
}

seedLocations().catch(async (error) => {
  logger.error('Échec seed Locations :', error.message);
  await disconnectDatabase();
  process.exit(1);
});
