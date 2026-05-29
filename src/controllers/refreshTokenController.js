const RefreshTokenService = require('../services/refreshTokenService');
const { generateToken } = require('../config/jwt');
const logger = require('../utils/logger');
const supabase = require('../config/database');

// Refresh access token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      logger.warn('Refresh token request missing token');
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Validate the refresh token
    const tokenData = await RefreshTokenService.validateRefreshToken(refreshToken);
    
    if (!tokenData) {
      logger.warn('Invalid or expired refresh token');
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Generate new access token
    const newAccessToken = generateToken(tokenData.user_id, tokenData.users.email);

    // Update last used timestamp
    await supabase
      .from('refresh_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    logger.info('Access token refreshed', { 
      userId: tokenData.user_id, 
      email: tokenData.users.email 
    });

    res.status(200).json({
      message: 'Token refreshed successfully',
      token: newAccessToken,
      user: {
        id: tokenData.users.id,
        name: tokenData.users.name,
        email: tokenData.users.email
      }
    });
  } catch (error) {
    logger.error('Error refreshing token', { error: error.message });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Revoke refresh token
const revokeToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.id;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Validate token belongs to the user
    const tokenData = await RefreshTokenService.validateRefreshToken(refreshToken);
    
    if (!tokenData || tokenData.user_id !== userId) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    await RefreshTokenService.revokeToken(tokenData.id);

    logger.info('Token revoked by user', { userId, tokenId: tokenData.id });

    res.status(200).json({ message: 'Token revoked successfully' });
  } catch (error) {
    logger.error('Error revoking token', { userId: req.user.id, error: error.message });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Revoke all user tokens (logout from all devices)
const revokeAllTokens = async (req, res) => {
  try {
    const userId = req.user.id;

    await RefreshTokenService.revokeAllUserTokens(userId);

    logger.info('All tokens revoked by user', { userId });

    res.status(200).json({ message: 'All tokens revoked successfully' });
  } catch (error) {
    logger.error('Error revoking all tokens', { userId: req.user.id, error: error.message });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's active tokens
const getUserTokens = async (req, res) => {
  try {
    const userId = req.user.id;

    const tokens = await RefreshTokenService.getUserTokens(userId);

    res.status(200).json({ tokens });
  } catch (error) {
    logger.error('Error getting user tokens', { userId: req.user.id, error: error.message });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  refreshToken,
  revokeToken,
  revokeAllTokens,
  getUserTokens
};
