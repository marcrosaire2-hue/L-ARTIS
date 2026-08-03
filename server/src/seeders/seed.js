/**
 * Seed idempotent : catégories + métiers + géographie du Bénin.
 * Lancer : npm run seed
 * Peut être relancé sans risque (upsert par slug / index unique).
 */
const env = require('../config/env');
const logger = require('../config/logger');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const { Category, Trade, Location } = require('../models');
const slugify = require('../utils/slugify');
const ARRONDISSEMENTS_BY_COMMUNE = require('./arrondissements.json');

// --- Géographie du Bénin : départements -> communes (77) ---
const BENIN_DEPARTMENTS = [
  { department: 'Alibori', communes: ['Banikoara', 'Gogounou', 'Kandi', 'Karimama', 'Malanville', 'Ségbana'] },
  { department: 'Atacora', communes: ['Boukoumbé', 'Cobly', 'Kérou', 'Kouandé', 'Matéri', 'Natitingou', 'Péhunco', 'Tanguiéta', 'Toucountouna'] },
  { department: 'Atlantique', communes: ['Abomey-Calavi', 'Allada', 'Kpomassè', 'Ouidah', 'Sô-Ava', 'Toffo', 'Tori-Bossito', 'Zè'] },
  { department: 'Borgou', communes: ['Bembéréké', 'Kalalé', "N'Dali", 'Nikki', 'Parakou', 'Pèrèrè', 'Sinendé', 'Tchaourou'] },
  { department: 'Collines', communes: ['Bantè', 'Dassa-Zoumè', 'Glazoué', 'Ouèssè', 'Savalou', 'Savè'] },
  { department: 'Couffo', communes: ['Aplahoué', 'Djakotomey', 'Dogbo', 'Klouékanmè', 'Lalo', 'Toviklin'] },
  { department: 'Donga', communes: ['Bassila', 'Copargo', 'Djougou', 'Ouaké'] },
  { department: 'Littoral', communes: ['Cotonou'] },
  { department: 'Mono', communes: ['Athiémé', 'Bopa', 'Comè', 'Grand-Popo', 'Houéyogbé', 'Lokossa'] },
  { department: 'Ouémé', communes: ['Adjarra', 'Adjohoun', 'Aguégués', 'Akpro-Missérété', 'Avrankou', 'Bonou', 'Dangbo', 'Porto-Novo', 'Sèmè-Kpodji'] },
  { department: 'Plateau', communes: ['Adja-Ouèrè', 'Ifangni', 'Kétou', 'Pobè', 'Sakété'] },
  { department: 'Zou', communes: ['Abomey', 'Agbangnizoun', 'Bohicon', 'Covè', 'Djidja', 'Ouinhi', 'Za-Kpota', 'Zagnanado', 'Zogbodomey'] },
];

// --- Quartiers (principaux arrondissements de Cotonou) ---
const COTONOU_DISTRICTS = [
  'Akpakpa', 'Cadjehoun', 'Fidjrossè', 'Gbégamey', 'Dantokpa', 'Haie-Vive',
  'Jéricho', 'Sainte-Rita', 'Aïtchédji', 'Agla', 'Védoko', 'Enagnon', 'Gbénamè',
];

const CATEGORIES_TRADES = [
  {
    category: { name: 'Maçonnerie', icon: '🧱', description: 'Construction et rénovation du gros œuvre' },
    trades: ['Maçon', 'Carreleur', 'Faïencier', 'Plâtrier'],
  },
  {
    category: { name: 'Électricité', icon: '⚡', description: 'Installation et maintenance électrique' },
    trades: ['Électricien bâtiment', 'Électricien industriel', 'Domoticien'],
  },
  {
    category: { name: 'Plomberie', icon: '🚿', description: 'Plomberie, sanitaire et chauffage' },
    trades: ['Plombier', 'Chauffagiste', 'Tuyauteur'],
  },
  {
    category: { name: 'Menuiserie', icon: '🪚', description: 'Travail du bois et aménagement' },
    trades: ['Menuisier', 'Ébéniste', 'Agenceur'],
  },
  {
    category: { name: 'Couture', icon: '🧵', description: 'Confection et retouche de vêtements' },
    trades: ['Couturier', 'Modéliste', 'Brodeur'],
  },
  {
    category: { name: 'Coiffure', icon: '💇', description: 'Coiffure homme, femme et barbier' },
    trades: ['Coiffeur', 'Barbier', 'Coiffeuse à domicile'],
  },
  {
    category: { name: 'Mécanique', icon: '🔧', description: 'Réparation et entretien de véhicules' },
    trades: ['Mécanicien auto', 'Mécanicien moto', 'Tôlier', 'Carrossier'],
  },
  {
    category: { name: 'Informatique', icon: '💻', description: 'Développement, réseaux et maintenance IT' },
    trades: ['Développeur web', 'Développeur mobile', 'Technicien réseaux', 'Réparateur informatique'],
  },
  {
    category: { name: 'Agriculture', icon: '🌾', description: 'Production agricole et espaces verts' },
    trades: ['Maraîcher', 'Agronome', 'Éleveur', 'Jardinier paysagiste'],
  },
  {
    category: { name: 'Climatisation', icon: '❄️', description: 'Climatisation, froid et ventilation' },
    trades: ['Technicien climatisation', 'Frigoriste', 'Installateur VMC'],
  },
  {
    category: { name: 'Photographie', icon: '📷', description: 'Prise de vue et vidéo professionnelle' },
    trades: ['Photographe événementiel', 'Photographe studio', 'Vidéaste'],
  },
  {
    category: { name: 'Décoration', icon: '🎨', description: 'Peinture, décoration et aménagement intérieur' },
    trades: ['Décorateur intérieur', 'Peintre en bâtiment', 'Tapissier'],
  },
];

async function seed() {
  await connectDatabase();

  // --- 1. Géographie du Bénin ---
  for (const entry of BENIN_DEPARTMENTS) {
    for (const commune of entry.communes) {
      const base = {
        country: 'Bénin',
        countryCode: 'BJ',
        department: entry.department,
        commune,
        district: '',
      };
      await Location.findOneAndUpdate(
        base,
        { $setOnInsert: base },
        { upsert: true }
      );
    }
  }
  for (const district of COTONOU_DISTRICTS) {
    const base = {
      country: 'Bénin',
      countryCode: 'BJ',
      department: 'Littoral',
      commune: 'Cotonou',
      district,
    };
    await Location.findOneAndUpdate(
      base,
      { $setOnInsert: base },
      { upsert: true }
    );
  }
  for (const department of Object.keys(ARRONDISSEMENTS_BY_COMMUNE)) {
    for (const commune of Object.keys(ARRONDISSEMENTS_BY_COMMUNE[department])) {
      for (const district of ARRONDISSEMENTS_BY_COMMUNE[department][commune]) {
        const base = {
          country: 'Bénin',
          countryCode: 'BJ',
          department,
          commune,
          district,
        };
        await Location.findOneAndUpdate(
          base,
          { $setOnInsert: base },
          { upsert: true }
        );
      }
    }
  }

  // --- 2. Catégories + métiers ---
  // NOTE : findOneAndUpdate ne déclenche PAS les hooks (pre-validate) :
  // les slugs sont donc générés explicitement ici.
  for (const entry of CATEGORIES_TRADES) {
    const { category: catData, trades } = entry;

    const category = await Category.findOneAndUpdate(
      { name: catData.name },
      { $setOnInsert: { ...catData, slug: slugify(catData.name) } },
      { upsert: true, new: true }
    );

    for (const tradeName of trades) {
      await Trade.findOneAndUpdate(
        { name: tradeName, category: category._id },
        {
          $setOnInsert: {
            name: tradeName,
            slug: slugify(tradeName),
            category: category._id,
          },
        },
        { upsert: true }
      );
    }
  }

  const categoryCount = await Category.countDocuments();
  const tradeCount = await Trade.countDocuments();
  const locationCount = await Location.countDocuments();
  logger.info(
    `Seed terminé : ${categoryCount} catégories, ${tradeCount} métiers, ${locationCount} localités du Bénin.`
  );

  await disconnectDatabase();
}

seed().catch(async (error) => {
  logger.error('Échec du seed :', error.message);
  await disconnectDatabase();
  process.exit(1);
});
