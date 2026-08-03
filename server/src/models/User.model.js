/**
 * Modèle User — socle d'authentification central.
 * Chaque personne possède UN seul User (email, password, rôle, statut).
 * Les profils spécialisés (Artisan/Client/Admin) référencent ce User.
 */
const mongoose = require('mongoose');
const paginatePlugin = require('./plugins/paginate.plugin');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { ROLES, ACCOUNT_STATUS, REGEX } = require('../constants');
const { normalizePhone, isValidPhone } = require('../utils/phone');

const userSchema = new mongoose.Schema(
  {
    // L'identifiant de connexion est le téléphone (cf. `phone`). L'e-mail
    // devient facultatif et ne sert plus qu'à la récupération de mot de passe.
    // Son unicité est portée par un index PARTIEL défini plus bas : un index
    // unique classique ferait collisionner tous les comptes sans e-mail.
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [REGEX.EMAIL, "Format d'adresse e-mail invalide"],
      default: undefined,
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CLIENT,
      index: true,
    },
    firstName: {
      type: String,
      required: [true, 'Le prénom est obligatoire'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    // Identifiant de connexion. Stocké normalisé en E.164 par le setter, afin
    // que « 97 12 34 56 » et « +229 97 12 34 56 » désignent le même compte.
    // Les administrateurs sont créés par script, sans numéro : l'obligation
    // ne porte donc que sur les comptes issus d'une inscription.
    phone: {
      type: String,
      trim: true,
      set: normalizePhone,
      required: [
        function requiredForSignups() {
          return this.role !== ROLES.ADMIN;
        },
        'Le numéro de téléphone est obligatoire',
      ],
      validate: {
        validator: (value) => !value || isValidPhone(value),
        message: 'Numéro de téléphone invalide',
      },
    },
    avatar: { type: String, default: '' },
    accountStatus: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.ACTIVE,
      index: true,
    },
    isEmailVerified: { type: Boolean, default: false, index: true },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    locale: { type: String, default: 'fr', enum: ['fr', 'en'] },
    lastLoginAt: { type: Date },
    suspendedAt: { type: Date },
    suspensionReason: { type: String, default: '' },
  },
  { timestamps: true }
);

// --- Unicité des identifiants ---
// Index PARTIELS : seuls les documents possédant réellement le champ sont
// contraints. Sans le filtre partiel, tous les comptes sans e-mail (ou les
// admins sans téléphone) entreraient en collision sur la valeur absente.
userSchema.index(
  { phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $type: 'string' } } }
);
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } }
);

// --- Index composé pour les recherches d'administrateur ---
userSchema.index({ role: 1, accountStatus: 1, createdAt: -1 });

// --- Hash du mot de passe uniquement s'il a été modifié ---
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, env.bcryptRounds);
  return next();
});

// --- Méthodes d'instance ---
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    email: this.email,
    role: this.role,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: `${this.firstName} ${this.lastName}`,
    phone: this.phone,
    avatar: this.avatar,
    accountStatus: this.accountStatus,
    isEmailVerified: this.isEmailVerified,
    locale: this.locale,
    createdAt: this.createdAt,
  };
};

// --- Masquage des champs sensibles en sortie JSON ---
userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.password;
    delete ret.emailVerificationToken;
    delete ret.emailVerificationExpires;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    return ret;
  },
});

paginatePlugin(userSchema);

module.exports = mongoose.model('User', userSchema);
