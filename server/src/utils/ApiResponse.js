/**
 * Structure de réponse JSON standardisée pour toute l'API.
 * { success, statusCode, message, data, meta }
 */
class ApiResponse {
  constructor(statusCode, message, data = null, meta = null) {
    this.success = true;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }

  static ok(message, data = null, meta = null) {
    return new ApiResponse(200, message, data, meta);
  }

  static created(message, data = null, meta = null) {
    return new ApiResponse(201, message, data, meta);
  }
}

module.exports = ApiResponse;
