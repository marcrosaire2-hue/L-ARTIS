/**
 * Contrôleur santé : permet de vérifier que l'API et la base
 * de données sont opérationnelles (utile pour les probes Docker/K8s).
 */
const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

const healthCheck = catchAsync(async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(dbState === 1 ? 200 : 503).json({
    success: dbState === 1,
    statusCode: dbState === 1 ? 200 : 503,
    message: dbState === 1 ? 'API opérationnelle' : 'Base de données indisponible',
    data: {
      service: 'artisans-marketplace-api',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      database: states[dbState],
    },
  });
});

module.exports = { healthCheck };
