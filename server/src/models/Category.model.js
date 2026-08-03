/**
 * Modèle Category — niveau 1 de la hiérarchie.
 * Catégorie -> Métiers (1─N)
 */
const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom de la catégorie est obligatoire'],
      trim: true,
      unique: true,
      minlength: 2,
      maxlength: 60,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    icon: { type: String, default: '' },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
    tradeCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Slug auto-généré à partir du nom
categorySchema.pre('validate', function (next) {
  if (this.name && !this.slug) this.slug = slugify(this.name);
  next();
});

module.exports = mongoose.model('Category', categorySchema);
