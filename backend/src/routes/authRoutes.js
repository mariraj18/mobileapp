const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { authSchemas } = require('../utils/validators');

router.post('/register', validate(authSchemas.register), authController.register);

router.post('/login', validate(authSchemas.login), authController.login);

router.post('/refresh', validate(authSchemas.refreshToken), authController.refreshTokenController);

router.get('/me', authenticate, authController.getMe);

router.get('/stats', authenticate, authController.getUserStats);

router.put('/profile', authenticate, authController.updateProfile);

router.post('/logout', authenticate, authController.logout);

module.exports = router;
