const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  refreshToken,
  revokeToken,
  revokeAllTokens,
  getUserTokens
} = require('../controllers/refreshTokenController');

// Public route - refresh access token
router.post('/refresh', refreshToken);

// Protected routes - require valid access token
router.post('/revoke', authenticateToken, revokeToken);
router.post('/revoke-all', authenticateToken, revokeAllTokens);
router.get('/tokens', authenticateToken, getUserTokens);

module.exports = router;
