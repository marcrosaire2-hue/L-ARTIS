/**
 * Modèle Location — référentiel géographique du Bénin (département ->
 * commune -> quartier), utilisé pour :
 *   - l'autocomplétion dans la recherche ;
 *   - la génération des filtres hiérarchiques.
 * La localisation précise de chaque artisan reste embarquée dans Artisan
 * (index 2dsphere + index composé) pour les recherches par distance.
 */
const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    country: { type: String, required: true, trim: true, default: 'Bénin' },
    countryCode: { type: String, trim: true, uppercase: true, default: 'BJ' },
    department: { type: String, required: true, trim: true },
    commune: { type: String, trim: true, default: '' },
    district: { type: String, trim: true, default: '' },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index texte : recherche plein texte sur la hiérarchie géographique
locationSchema.index(
  {
    district: 'text',
    commune: 'text',
    department: 'text',
    country: 'text',
  },
  { name: 'location_search_text' }
);

// Unicité : une entrée (pays, département, commune, quartier)
locationSchema.index(
  { country: 1, department: 1, commune: 1, district: 1 },
  { unique: true }
);

locationSchema.index({ coordinates: '2dsphere' });
locationSchema.index({ commune: 1, isActive: 1 });
locationSchema.index({ department: 1, isActive: 1 });

module.exports = mongoose.model('Location', locationSchema);
