/**
 * Wrapper DRY : évite de répéter try/catch dans chaque contrôleur.
 * Toute erreur (synchrone ou rejet de promesse) est propagée
 * au middleware centralisé d'erreurs.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
