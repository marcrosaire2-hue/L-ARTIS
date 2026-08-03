/**
 * Middleware d'expiration des mauvaises méthodes HTTP.
 * Retourne 405 si la route existe mais pas la méthode.
 */
const methodNotAllowedHandler = (req, res) => {
  res.status(405).json({
    success: false,
    statusCode: 405,
    message: `Méthode ${req.method} non autorisée sur ${req.originalUrl}`,
  });
};

module.exports = methodNotAllowedHandler;
