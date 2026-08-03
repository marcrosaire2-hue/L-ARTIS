/**
 * Erreur applicative typée.
 * Permet de transporter un code HTTP et un message métier
 * jusqu'au middleware centralisé de gestion des erreurs.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
