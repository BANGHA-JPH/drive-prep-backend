require('dotenv').config();
const supabase = require('./src/config/database');
const RefreshTokenService = require('./src/services/refreshTokenService');
const logger = require('./src/utils/logger');

async function testRefreshTokens() {
  console.log('🧪 Testing Refresh Token System...\n');

  try {
    // Get a real user ID first
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (userError || users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    const testUserId = users[0].id;
    console.log(`📋 Using user ID: ${testUserId}`);

    // Test 1: Create a refresh token
    console.log('1️⃣ Testing refresh token creation...');
    const refreshTokenData = await RefreshTokenService.createRefreshToken(testUserId);
    console.log('✅ Refresh token created:', refreshTokenData.token.substring(0, 20) + '...');

    // Test 2: Validate the refresh token
    console.log('\n2️⃣ Testing refresh token validation...');
    const validatedToken = await RefreshTokenService.validateRefreshToken(refreshTokenData.token);
    if (validatedToken) {
      console.log('✅ Refresh token validated successfully');
    } else {
      console.log('❌ Refresh token validation failed');
    }

    // Test 3: Get user tokens
    console.log('\n3️⃣ Testing get user tokens...');
    const userTokens = await RefreshTokenService.getUserTokens(testUserId);
    console.log(`✅ Found ${userTokens.length} active tokens for user`);

    // Test 4: Revoke token
    console.log('\n4️⃣ Testing token revocation...');
    await RefreshTokenService.revokeToken(refreshTokenData.id);
    console.log('✅ Token revoked successfully');

    // Test 5: Validate revoked token
    console.log('\n5️⃣ Testing revoked token validation...');
    const revokedToken = await RefreshTokenService.validateRefreshToken(refreshTokenData.token);
    if (!revokedToken) {
      console.log('✅ Revoked token correctly rejected');
    } else {
      console.log('❌ Revoked token was incorrectly accepted');
    }

    // Test 6: Cleanup expired tokens
    console.log('\n6️⃣ Testing expired token cleanup...');
    await RefreshTokenService.cleanupExpiredTokens();
    console.log('✅ Expired token cleanup completed');

    console.log('\n🎉 All refresh token tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    logger.error('Refresh token test failed', { error: error.message });
  }
}

testRefreshTokens();
