const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { validateParams } = require('../middleware/validation');
const { userCodeParam } = require('../utils/validators');

// Find user by code
router.get('/code/:userCode', authenticate, validateParams(userCodeParam), userController.findByCode);

// Search users
router.get('/search', authenticate, userController.searchUsers);

// Get user profile by ID
router.get('/:id', authenticate, userController.getUserProfile);

module.exports = router;