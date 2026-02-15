const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { authSchemas } = require('../utils/validators');

// ========== FIXED: Handle OPTIONS requests for all routes ==========
router.options('*', (req, res) => {
  // Set CORS headers for preflight
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});
// ====================================================================

// Public routes
router.post('/register', validate(authSchemas.register), authController.register);
router.post('/login', validate(authSchemas.login), authController.login);
router.post('/refresh', validate(authSchemas.refreshToken), authController.refreshTokenController);

// Protected routes (require authentication)
router.get('/me', authenticate, authController.getMe);
router.get('/stats', authenticate, authController.getUserStats);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/logout', authenticate, authController.logout);

module.exports = router;