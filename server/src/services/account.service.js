/**
 * Service compte — suppression par l'utilisateur lui-même.
 *
 * Choix de conception : suppression RÉELLE et non passage en « supprimé ».
 * Un compte simplement marqué garderait le numéro de téléphone, qui est
 * l'identifiant unique : la personne ne pourrait jamais se réinscrire avec le
 * sien. Effacer libère le numéro et respecte l'intention de partir.
 *
 * Ce qui disparaît : le compte, son profil, ses sessions, ses favoris, ses
 * notifications, ses avis (avec recalcul des notes concernées) et, pour un
 * artisan, sa fiche, ses prestations, sa galerie et ses médias.
 *
 * Ce qui subsiste : les DEVIS. Ils constituent l'historique commercial de
 * l'autre partie, qui n'a pas à perdre ses traces parce que son interlocuteur
 * s'en va. La référence devient orpheline et l'interface affiche alors
 * « utilisateur supprimé ».
 */
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const {
  User,
  Artisan,
  Client,
  Service,
  Gallery,
  Media,
  Review,
  Favorite,
  Notification,
  Session,
} = require('../models');
const { ROLES } = require('../constants');
const { recalculateRating } = require('./review.service');

/**
 * Efface toutes les données rattachées à un compte.
 * Partagé entre la suppression par l'utilisateur et celle par un
 * administrateur : sans mise en commun, la seconde laissait derrière elle des
 * avis, prestations et galeries orphelins pointant vers un profil disparu.
 */
async function purgeUserData(userId, role) {
  const ownReviews = await Review.find({ client: userId }).select('artisan').lean();
  const affectedArtisans = [...new Set(ownReviews.map((r) => String(r.artisan)))];

  await Promise.all([
    Review.deleteMany({ client: userId }),
    Favorite.deleteMany({ client: userId }),
    Notification.deleteMany({ user: userId }),
    Session.deleteMany({ user: userId }),
  ]);

  if (role === ROLES.ARTISAN) {
    const artisan = await Artisan.findOne({ userId }).select('_id');
    if (artisan) {
      await Promise.all([
        Service.deleteMany({ artisan: artisan._id }),
        Gallery.deleteMany({ artisan: artisan._id }),
        Review.deleteMany({ artisan: artisan._id }),
        Favorite.deleteMany({ artisan: artisan._id }),
      ]);
      await Artisan.deleteOne({ _id: artisan._id });
    }
  } else {
    await Client.deleteMany({ userId });
  }

  await Media.deleteMany({ uploadedBy: userId });
  await User.deleteOne({ _id: userId });

  // Les notes des artisans évalués par ce compte doivent être recalculées
  await Promise.all(affectedArtisans.map((id) => recalculateRating(id).catch(() => {})));
}

async function deleteMyAccount(userId, password) {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new ApiError(404, 'Utilisateur introuvable');

  if (user.role === ROLES.ADMIN) {
    throw new ApiError(403, 'Un compte administrateur ne peut pas être supprimé depuis le site');
  }

  // Ré-authentification : une session volée ne doit pas suffire à effacer
  // définitivement le compte de quelqu'un.
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Mot de passe incorrect');
  }

  await purgeUserData(userId, user.role);

  logger.info(`Compte supprimé par son titulaire : ${user.phone} (${user.role})`);
}

module.exports = { deleteMyAccount, purgeUserData };
