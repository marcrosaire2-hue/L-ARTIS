/**
 * Export centralisé des modèles.
 * Tous les modèles sont enregistrés ici pour garantir leur
 * chargement et simplifier les imports dans les services.
 */
const User = require('./User.model');
const Artisan = require('./Artisan.model');
const Client = require('./Client.model');
const Admin = require('./Admin.model');
const Category = require('./Category.model');
const Trade = require('./Trade.model');
const Service = require('./Service.model');
const Quote = require('./Quote.model');
const Review = require('./Review.model');
const Conversation = require('./Conversation.model');
const Message = require('./Message.model');
const Notification = require('./Notification.model');
const Report = require('./Report.model');
const Gallery = require('./Gallery.model');
const Location = require('./Location.model');
const Subscription = require('./Subscription.model');
const Favorite = require('./Favorite.model');
const Media = require('./Media.model');
const Session = require('./Session.model');

module.exports = {
  User,
  Artisan,
  Client,
  Admin,
  Category,
  Trade,
  Service,
  Quote,
  Review,
  Conversation,
  Message,
  Notification,
  Report,
  Gallery,
  Location,
  Subscription,
  Favorite,
  Media,
  Session,
};
