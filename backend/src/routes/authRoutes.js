const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { authSchemas } = require('../utils/validators');
const { User } = require('../models');
const { Expo } = require('expo-server-sdk');

// ========== Handle OPTIONS requests for all routes ==========
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// ========== Public routes ==========
router.post('/register', validate(authSchemas.register), authController.register);
router.post('/login', validate(authSchemas.login), authController.login);
router.post('/refresh', validate(authSchemas.refreshToken), authController.refreshTokenController);

// ========== Protected routes (require authentication) ==========
router.get('/me', authenticate, authController.getMe);
router.get('/stats', authenticate, authController.getUserStats);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/push-token', authenticate, authController.updatePushToken);
router.post('/logout', authenticate, authController.logout);

// ========== DEBUG ROUTES - For testing push notifications ==========
/**
 * Debug: Check if push token is saved in database
 */
router.get('/debug-token', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'push_token']
    });
    
    // Check if token is valid Expo format
    const isValidFormat = user.push_token ? Expo.isExpoPushToken(user.push_token) : false;
    
    res.json({
      success: true,
      data: {
        email: user.email,
        hasPushToken: !!user.push_token,
        tokenPreview: user.push_token ? 
          user.push_token.substring(0, 30) + '...' : null,
        tokenLength: user.push_token?.length || 0,
        isValidFormat: isValidFormat,
        fullToken: user.push_token || null
      }
    });
  } catch (error) {
    console.error('Debug token error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Debug: Send a test push notification
 */
router.post('/test-push', authenticate, async (req, res) => {
  try {
    const { sendNotification } = require('../utils/notificationService');
    
    // Check if user has token first
    const user = await User.findByPk(req.user.id, {
      attributes: ['push_token', 'name']
    });
    
    if (!user.push_token) {
      return res.json({
        success: false,
        message: 'No push token found for this user. Please log in again.',
        data: { hasToken: false }
      });
    }
    
    const result = await sendNotification({
      user_id: req.user.id,
      type: 'TEST',
      message: `🔔 Test notification at ${new Date().toLocaleTimeString()}`,
      data: { 
        test: true,
        timestamp: new Date().toISOString(),
        source: 'debug-endpoint'
      }
    });
    
    res.json({ 
      success: true, 
      message: 'Test push notification sent',
      data: {
        notificationCreated: !!result,
        userId: req.user.id,
        tokenPresent: !!user.push_token
      }
    });
  } catch (error) {
    console.error('Test push error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Debug: Clear push token (for testing)
 */
router.post('/clear-token', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    user.push_token = null;
    await user.save();
    
    res.json({
      success: true,
      message: 'Push token cleared successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;