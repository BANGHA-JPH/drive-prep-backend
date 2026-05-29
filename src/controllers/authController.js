const bcrypt = require('bcryptjs');
const supabase = require('../config/database');
const { generateToken } = require('../config/jwt');
const { validateSignUp, validateLogin } = require('../utils/validation');
const logger = require('../utils/logger');
const RefreshTokenService = require('../services/refreshTokenService');
const { sendOTPEmail } = require('../services/mailService');

// Sign Up Controller
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    logger.info('Signup attempt', { email, name });

    // Validate input
    const validation = validateSignUp(name, email, password);
    if (!validation.isValid) {
      logger.warn('Signup validation failed', { email, errors: validation.errors });
      return res.status(400).json({ errors: validation.errors });
    }

    // Check if user already exists
    logger.logDatabase('select', 'users', { email });
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      logger.warn('Signup failed - email already exists', { email });
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database
    logger.logDatabase('insert', 'users', { email, name });
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password_hash: hashedPassword,
          created_at: new Date()
        }
      ])
      .select();

    if (error) {
      logger.error('Database error during signup', { email, error: error.message });
      return res.status(400).json({ message: 'Error creating user', error: error.message });
    }

    const user = newUser[0];
    const token = generateToken(user.id, user.email);
    
    // Create refresh token
    const refreshTokenData = await RefreshTokenService.createRefreshToken(user.id);
    
    logger.logAuth('signup_success', user.id, user.email);
    logger.info('User created successfully', { userId: user.id, email: user.email });

    res.status(201).json({
      message: 'User created successfully',
      token,
      refreshToken: refreshTokenData.token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    logger.error('Server error during signup', { email: req.body.email, error: error.message });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login Controller
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    logger.info('Login attempt', { email });

    // Validate input
    const validation = validateLogin(email, password);
    if (!validation.isValid) {
      logger.warn('Login validation failed', { email, errors: validation.errors });
      return res.status(400).json({ errors: validation.errors });
    }

    // Find user by email
    logger.logDatabase('select', 'users', { email });
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      logger.warn('Login failed - user not found', { email });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      logger.warn('Login failed - invalid password', { email, userId: user.id });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user.id, user.email);
    
    // Create refresh token
    const refreshTokenData = await RefreshTokenService.createRefreshToken(user.id);
    
    logger.logAuth('login_success', user.id, user.email);
    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    res.status(200).json({
      message: 'Login successful',
      token,
      refreshToken: refreshTokenData.token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    logger.error('Server error during login', { email: req.body.email, error: error.message });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Current User Controller
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Profile Controller
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }

    logger.logDatabase('update', 'users', { userId, name });
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ name: name.trim() })
      .eq('id', userId)
      .select('id, name, email')
      .single();

    if (error) {
      logger.error('Database error during profile update', { userId, error: error.message });
      return res.status(400).json({ message: 'Error updating profile', error: error.message });
    }

    logger.info('Profile updated successfully', { userId });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    logger.error('Server error during profile update', { userId: req.user.id, error: error.message });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Forgot Password Controller
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    logger.info('Forgot password attempt', { email });

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (error || !user) {
      logger.warn('Forgot password failed - email not found', { email });
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    console.log('--- DEBUG: Generating OTP ---');
    console.log('Current Server Time:', new Date().toISOString());
    console.log('Calculated Expiry:', expiresAt.toISOString());

    // Update user with reset code
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        reset_code: otp, 
        reset_code_expires_at: expiresAt.toISOString() 
      })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Database error saving reset code', { error: updateError.message });
      return res.status(500).json({ message: 'Error processing request' });
    }

    // Send the real email
    const mailResult = await sendOTPEmail(email, otp);

    if (!mailResult.success) {
      logger.error('Failed to send OTP email', { error: mailResult.error });
      return res.status(500).json({ message: 'Error sending verification email' });
    }

    logger.info('Forgot password success - OTP sent', { email, userId: user.id });

    res.status(200).json({
      message: process.env.NODE_ENV === 'development' 
        ? 'A verification code has been sent (check server logs for dev code).' 
        : 'If an account exists, a verification code has been sent.'
    });
  } catch (error) {
    logger.error('Server error during forgot password', { email: req.body.email, error: error.message });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify OTP Controller
const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, reset_code, reset_code_expires_at')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.reset_code || String(user.reset_code) !== String(code)) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    const storedExpiry = new Date(user.reset_code_expires_at).getTime();
    const currentTime = new Date().getTime();
    
    console.log('--- DEBUG: OTP Verification ---');
    console.log('Current Time (ms):', currentTime);
    console.log('Stored Expiry (ms):', storedExpiry);
    console.log('Diff (ms):', storedExpiry - currentTime);
    
    if (storedExpiry < currentTime) {
      console.log('Result: EXPIRED');
      return res.status(400).json({ message: 'Verification code has expired' });
    }
    console.log('Result: VALID');

    res.status(200).json({ message: 'Code verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reset Password Controller
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, reset_code, reset_code_expires_at')
      .eq('email', email)
      .single();

    if (!user.reset_code || String(user.reset_code) !== String(code) || new Date(user.reset_code_expires_at).getTime() < new Date().getTime()) {
      return res.status(400).json({ message: 'Invalid or expired session' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: hashedPassword,
        reset_code: null,
        reset_code_expires_at: null
      })
      .eq('id', user.id);

    if (updateError) {
      return res.status(500).json({ message: 'Error updating password' });
    }

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  signup,
  login,
  getCurrentUser,
  updateProfile,
  forgotPassword,
  verifyCode,
  resetPassword
};
