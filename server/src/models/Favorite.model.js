/**
 * Modèle Favorite — artisan mis en favori par un client.
 */
const mongoose = require('mongoose');
const paginatePlugin = require('./plugins/paginate.plugin');

const favoriteSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    artisan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artisan',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Un client ne peut ajouter un artisan qu'une seule fois
favoriteSchema.index({ client: 1, artisan: 1 }, { unique: true });

paginatePlugin(favoriteSchema);

module.exports = mongoose.model('Favorite', favoriteSchema);
