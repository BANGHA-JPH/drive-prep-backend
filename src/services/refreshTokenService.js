const supabase = require('../config/database');
const TokenGenerator = require('../utils/tokenGenerator');
const logger = require('../utils/logger');

class RefreshTokenService {
  // Create a new refresh token for a user
  static async createRefreshToken(userId, deviceId = null) {
    try {
      const refreshToken = TokenGenerator.generateRefreshToken();
      const expiresAt = TokenGenerator.getRefreshTokenExpiry();

      const { data, error } = await supabase
        .from('refresh_tokens')
        .insert([{
          user_id: userId,
          token: refreshToken,
          expires_at: expiresAt.toISOString()
        }])
        .select();

      if (error) {
        logger.error('Failed to create refresh token', { userId, error: error.message });
        throw new Error('Failed to create refresh token');
      }

      logger.info('Refresh token created', { userId, tokenId: data[0].id });
      return data[0];
    } catch (error) {
      logger.error('Error creating refresh token', { userId, error: error.message });
      throw error;
    }
  }

  // Validate refresh token and get user info
  static async validateRefreshToken(token) {
    try {
      const { data: refreshToken, error } = await supabase
        .from('refresh_tokens')
        .select(`
          id,
          user_id,
          expires_at,
          created_at
        `)
        .eq('token', token)
        .single();

      if (error) {
        logger.warn('Invalid refresh token', { token: token.substring(0, 10) + '...' });
        return null;
      }

      // Check if token is expired
      if (TokenGenerator.isTokenExpired(refreshToken.expires_at)) {
        logger.warn('Expired refresh token', { tokenId: refreshToken.id });
        await this.revokeToken(refreshToken.id);
        return null;
      }

      // Get user data
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('id', refreshToken.user_id)
        .single();

      if (userError) {
        logger.error('Failed to get user data for refresh token', { userId: refreshToken.user_id, error: userError.message });
        return null;
      }

      refreshToken.users = user;
      logger.info('Refresh token validated', { userId: refreshToken.user_id });
      return refreshToken;
    } catch (error) {
      logger.error('Error validating refresh token', { error: error.message });
      return null;
    }
  }

  // Revoke a specific refresh token
  static async revokeToken(tokenId) {
    try {
      const { error } = await supabase
        .from('refresh_tokens')
        .delete()
        .eq('id', tokenId);

      if (error) {
        logger.error('Failed to revoke refresh token', { tokenId, error: error.message });
        throw new Error('Failed to revoke refresh token');
      }

      logger.info('Refresh token revoked', { tokenId });
      return true;
    } catch (error) {
      logger.error('Error revoking refresh token', { tokenId, error: error.message });
      throw error;
    }
  }

  // Revoke all tokens for a user
  static async revokeAllUserTokens(userId) {
    try {
      const { error } = await supabase
        .from('refresh_tokens')
        .delete()
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to revoke all user tokens', { userId, error: error.message });
        throw new Error('Failed to revoke all user tokens');
      }

      logger.info('All user tokens revoked', { userId });
      return true;
    } catch (error) {
      logger.error('Error revoking all user tokens', { userId, error: error.message });
      throw error;
    }
  }

  // Clean up expired tokens (should be run periodically)
  static async cleanupExpiredTokens() {
    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('refresh_tokens')
        .delete()
        .lt('expires_at', now);

      if (error) {
        logger.error('Failed to cleanup expired tokens', { error: error.message });
        throw new Error('Failed to cleanup expired tokens');
      }

      logger.info('Expired tokens cleaned up');
      return true;
    } catch (error) {
      logger.error('Error cleaning up expired tokens', { error: error.message });
      throw error;
    }
  }

  // Get all active tokens for a user
  static async getUserTokens(userId) {
    try {
      const { data, error } = await supabase
        .from('refresh_tokens')
        .select('id, created_at, expires_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to get user tokens', { userId, error: error.message });
        throw new Error('Failed to get user tokens');
      }

      return data;
    } catch (error) {
      logger.error('Error getting user tokens', { userId, error: error.message });
      throw error;
    }
  }
}

module.exports = RefreshTokenService;
