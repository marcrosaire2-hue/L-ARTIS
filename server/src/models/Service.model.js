/**
 * Modèle Service — une RÉALISATION publiée par un artisan.
 *
 * Un seul objet pour ce que l'artisan montre et ce qu'il vend : la photo d'une
 * coiffure, d'une robe ou d'une table EST l'offre. Séparer « galerie » et
 * « prestation » obligeait à saisir deux fois la même chose, et personne ne
 * savait laquelle des deux le client regardait.
 *
 * Le modèle reste générique quel que soit le métier :
 *   coiffeur   -> « Braids Butterfly », tresses, 15 000 F, 3 h
 *   couturier  -> « Robe de soirée », sur mesure, à partir de 25 000 F
 *   menuisier  -> « Table en bois massif », 120 000 F
 *   photographe-> « Shooting mariage », forfait journée
 */
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    artisan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artisan',
      required: true,
      index: true,
    },
    trade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trade',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Le titre de la réalisation est obligatoire'],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    // Photos de la réalisation. Références Media (et non URLs brutes) pour
    // que la suppression d'une réalisation efface aussi les fichiers chez
    // l'hébergeur d'images, qui est facturé au volume stocké.
    media: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: 'Maximum 10 photos par réalisation',
      },
      default: [],
    },
    // Facultatif : beaucoup de métiers ne peuvent pas annoncer un prix ferme
    // sans avoir vu le chantier. Un prix absent vaut « sur devis ».
    price: { type: Number, min: 0 },
    priceUnit: {
      type: String,
      enum: ['heure', 'jour', 'forfait', 'projet'],
      default: 'forfait',
    },
    durationMin: { type: Number, min: 5 },
    isActive: { type: Boolean, default: true, index: true },
    isPromoted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/** Première photo : vignette utilisée dans les listes et la recherche. */
serviceSchema.virtual('coverUrl').get(function () {
  const first = this.media?.[0];
  return first && typeof first === 'object' ? first.url || null : null;
});

serviceSchema.set('toJSON', { virtuals: true });
serviceSchema.set('toObject', { virtuals: true });

// Index listing par artisan et par métier
serviceSchema.index({ artisan: 1, isActive: 1 });
serviceSchema.index({ trade: 1, price: 1 });

module.exports = mongoose.model('Service', serviceSchema);
