/**
 * Modèle Artisan — fiche publique professionnelle.
 * La localisation est EMBARQUÉE (coordonnées + adresse) pour permettre
 * les recherches $geoNear (distance) et les filtres par ville/quartier/
 * département/région/pays avec des index natifs.
 */
const mongoose = require('mongoose');
const paginatePlugin = require('./plugins/paginate.plugin');
const { ARTISAN_STATUS, REGEX } = require('../constants');
const { normalizePhone, isValidPhone } = require('../utils/phone');

const workHourSchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
      comment: '0 = dimanche, 1 = lundi, ...',
    },
    open: { type: String, default: '08:00', match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    close: { type: String, default: '18:00', match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false }
);

const artisanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    artisanId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9][a-z0-9-]*$/, "L'identifiant public ne peut contenir que des lettres, chiffres et tirets"],
      index: true,
    },
    displayName: {
      type: String,
      required: [true, 'Le nom commercial est obligatoire'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    tagline: { type: String, trim: true, maxlength: 120, default: '' },
    bio: { type: String, trim: true, maxlength: 2000, default: '' },
    profilePhoto: { type: String, default: '' },
    logo: { type: String, default: '' },
    coverPhoto: { type: String, default: '' },
    status: {
      type: String,
      enum: Object.values(ARTISAN_STATUS),
      default: ARTISAN_STATUS.PENDING,
      index: true,
    },
    rejectionReason: { type: String, default: '' },
    trades: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trade',
        validate: {
          validator: (v) => mongoose.Types.ObjectId.isValid(v),
          message: 'Métier invalide',
        },
      },
    ],
    skills: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: 40 }],
      validate: {
        validator: (arr) => arr.length <= 50,
        message: 'Maximum 50 compétences',
      },
      default: [],
    },
    yearsExperience: { type: Number, min: 0, max: 80, default: 0 },
    pricing: {
      fromPrice: { type: Number, min: 0, default: 0 },
      currency: { type: String, default: 'XOF', maxlength: 5 },
      unit: {
        type: String,
        enum: ['heure', 'jour', 'forfait', 'projet'],
        default: 'jour',
      },
      isFreeEstimate: { type: Boolean, default: true },
    },
    // Localisation (hierarchie beninoise : departement -> commune -> quartier)
    location: {
      country: { type: String, trim: true, default: 'Bénin' },
      countryCode: { type: String, trim: true, uppercase: true, default: 'BJ' },
      department: { type: String, trim: true, default: '' },
      commune: { type: String, trim: true, default: '' },
      district: { type: String, trim: true, default: '' },
      address: { type: String, trim: true, default: '', maxlength: 200 },
      coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },
    workHours: { type: [workHourSchema], default: [] },
    availability: {
      isAvailable: { type: Boolean, default: true, index: true },
      note: { type: String, maxlength: 200, default: '' },
    },
    socialLinks: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    // Numéro affiché publiquement, initialisé avec celui du compte mais
    // modifiable : un artisan peut vouloir séparer ligne pro et ligne perso.
    contactPhone: {
      type: String,
      trim: true,
      set: normalizePhone,
      validate: {
        validator: (value) => !value || isValidPhone(value),
        message: 'Numéro de contact invalide',
      },
      default: '',
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [REGEX.EMAIL, 'E-mail de contact invalide'],
      default: '',
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    viewCount: { type: Number, default: 0 },
    favoriteCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false, index: true },
    isVerified: { type: Boolean, default: false },
    validationBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    validatedAt: { type: Date },
  },
  { timestamps: true }
);

// --- Index de recherche texte (nom, bio, compétences) ---
artisanSchema.index(
  { displayName: 'text', tagline: 'text', bio: 'text', skills: 'text' },
  { name: 'artisan_search_text' }
);

// --- Index géospatial pour la recherche par distance ---
artisanSchema.index({ 'location.coordinates': '2dsphere' });

// --- Index composé localisation (filtres hiérarchiques Bénin) ---
artisanSchema.index({
  'location.country': 1,
  'location.department': 1,
  'location.commune': 1,
  'location.district': 1,
});

// --- Index de listing ---
artisanSchema.index({ status: 1, 'rating.average': -1, createdAt: -1 });
artisanSchema.index({ isFeatured: 1, 'rating.average': -1 });

paginatePlugin(artisanSchema);

module.exports = mongoose.model('Artisan', artisanSchema);
