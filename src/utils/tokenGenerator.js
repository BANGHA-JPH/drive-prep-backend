const crypto = require('crypto');

class TokenGenerator {
  // Generate a secure random refresh token
  static generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
  }

  // Generate a secure random token for email verification, password reset, etc.
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate a unique device identifier
  static generateDeviceId() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Calculate expiry date for refresh tokens (30 days)
  static getRefreshTokenExpiry() {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    return expiryDate;
  }

  // Check if a refresh token is expired
  static isTokenExpired(expiryDate) {
    return new Date() > new Date(expiryDate);
  }
}

module.exports = TokenGenerator;
