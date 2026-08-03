/**
 * Service devis — cycle de vie complet :
 * pending -> accepted | rejected -> completed | cancelled
 */
const { Quote, Artisan, User } = require('../models');
const ApiError = require('../utils/ApiError');
const { QUOTE_STATUS } = require('../constants');
const { notifyUser } = require('./notification.service');

async function createQuote(clientId, data) {
  const artisan = await Artisan.findOne({ _id: data.artisanId, status: 'validated' });
  if (!artisan) throw new ApiError(404, 'Artisan introuvable ou non publié');

  if (artisan.userId.toString() === clientId.toString()) {
    throw new ApiError(400, 'Vous ne pouvez pas demander un devis à votre propre profil');
  }

  const quote = await Quote.create({
    client: clientId,
    artisan: artisan._id,
    service: data.serviceId,
    title: data.title,
    description: data.description,
    budget: data.budget || {},
    preferredDate: data.preferredDate,
    location: data.location || {},
  });

  await notifyUser(
    artisan.userId,
    'quote_new',
    'Nouvelle demande de devis',
    `${data.title} — voir la demande dans votre tableau de bord`,
    { quoteId: quote._id, url: `/artisan/quotes/${quote._id}` }
  );

  return quote;
}

async function listClientQuotes(clientId, { status, page, limit }) {
  const filters = { client: clientId };
  if (status) filters.status = status;

  return Quote.paginate({
    page,
    limit,
    filters,
    sort: { createdAt: -1 },
    populate: [
      { path: 'artisan', select: 'artisanId displayName profilePhoto rating location.commune' },
      { path: 'service', select: 'title price' },
    ],
  });
}

async function listArtisanQuotes(artisanId, { status, page, limit }) {
  const filters = { artisan: artisanId };
  if (status) filters.status = status;

  return Quote.paginate({
    page,
    limit,
    filters,
    sort: { createdAt: -1 },
    populate: [
      { path: 'client', select: 'firstName lastName avatar phone' },
      { path: 'service', select: 'title price' },
    ],
  });
}

async function getQuote(quoteId, user) {
  const quote = await Quote.findById(quoteId)
    .populate('client', 'firstName lastName avatar phone')
    // userId est indispensable au contrôle d'accès de l'artisan ci-dessous
    .populate('artisan', 'artisanId displayName profilePhoto userId')
    .populate('service', 'title price priceUnit');

  if (!quote) throw new ApiError(404, 'Devis introuvable');

  const isClient = quote.client._id.toString() === user._id.toString();
  const isArtisan = quote.artisan.userId?.toString() === user._id.toString();

  if (!isClient && !isArtisan) {
    throw new ApiError(403, 'Accès refusé à ce devis');
  }

  return quote;
}

/**
 * Réponse de l'artisan : accepte (avec prix/délai/message) ou refuse.
 */
async function respondToQuote(quoteId, artisan, data) {
  const quote = await Quote.findById(quoteId);
  if (!quote) throw new ApiError(404, 'Devis introuvable');
  if (quote.artisan.toString() !== artisan._id.toString()) {
    throw new ApiError(403, 'Ce devis ne vous est pas destiné');
  }
  if (quote.status !== QUOTE_STATUS.PENDING) {
    throw new ApiError(409, `Ce devis n'est plus en attente (statut : ${quote.status})`);
  }

  if (data.status === QUOTE_STATUS.ACCEPTED) {
    if (data.price === undefined || data.price < 0) {
      throw new ApiError(422, 'Un prix est requis pour accepter un devis');
    }
    quote.response = {
      price: data.price,
      durationDays: data.durationDays || 1,
      message: data.message || '',
      respondedAt: new Date(),
    };
    quote.status = QUOTE_STATUS.ACCEPTED;
  } else if (data.status === QUOTE_STATUS.REJECTED) {
    quote.response = { message: data.message || '', respondedAt: new Date() };
    quote.status = QUOTE_STATUS.REJECTED;
  } else {
    throw new ApiError(422, 'Statut de réponse invalide (accepted | rejected)');
  }

  await quote.save();

  await notifyUser(
    quote.client,
    'quote_status',
    `Réponse à votre demande de devis`,
    `Votre demande « ${quote.title} » a été ${quote.status === QUOTE_STATUS.ACCEPTED ? 'acceptée' : 'refusée'}`,
    { quoteId: quote._id, url: `/client/quotes/${quote._id}` }
  );

  return quote;
}

/**
 * Le client met à jour le statut : terminée ou annulée.
 */
async function updateQuoteStatus(quoteId, clientId, data) {
  const quote = await Quote.findById(quoteId);
  if (!quote) throw new ApiError(404, 'Devis introuvable');
  if (quote.client.toString() !== clientId.toString()) {
    throw new ApiError(403, 'Vous n\'êtes pas le demandeur de ce devis');
  }

  if (data.status === QUOTE_STATUS.COMPLETED) {
    if (quote.status !== QUOTE_STATUS.ACCEPTED) {
      throw new ApiError(409, 'Seul un devis accepté peut être marqué terminé');
    }
    quote.status = QUOTE_STATUS.COMPLETED;
    quote.clientNotes = data.clientNotes || '';
  } else if (data.status === QUOTE_STATUS.REJECTED && quote.status === QUOTE_STATUS.PENDING) {
    quote.status = QUOTE_STATUS.REJECTED;
    quote.cancelReason = data.cancelReason || '';
    quote.cancelledAt = new Date();
  } else {
    throw new ApiError(422, 'Transition de statut invalide');
  }

  await quote.save();

  const artisan = await Artisan.findById(quote.artisan);
  if (artisan) {
    await notifyUser(
      artisan.userId,
      'quote_status',
      'Statut de votre devis mis à jour',
      `La demande « ${quote.title} » est maintenant ${quote.status}`,
      { quoteId: quote._id, url: `/artisan/quotes/${quote._id}` }
    );
  }

  return quote;
}

module.exports = {
  createQuote,
  listClientQuotes,
  listArtisanQuotes,
  getQuote,
  respondToQuote,
  updateQuoteStatus,
};
