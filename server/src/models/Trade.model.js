/**
 * Modèle Trade — métier du secteur (niveau 2 de la hiérarchie).
 * Appartient à une catégorie ; est référencé par les artisans.
 */
const mongoose = require('mongoose');
const paginatePlugin = require('./plugins/paginate.plugin');
const slugify = require('../utils/slugify');

const tradeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du métier est obligatoire'],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Le métier doit appartenir à une catégorie'],
      index: true,
    },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    icon: { type: String, default: '' },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    artisanCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Unicité du slug par catégorie
tradeSchema.index({ slug: 1, category: 1 }, { unique: true });

tradeSchema.pre('validate', function (next) {
  if (this.name && !this.slug) this.slug = slugify(this.name);
  next();
});

paginatePlugin(tradeSchema);

module.exports = mongoose.model('Trade', tradeSchema);
