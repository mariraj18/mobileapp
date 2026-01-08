const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const { validateQuery, validateParams } = require('../middleware/validation');
const { notificationSchemas, uuidParam } = require('../utils/validators');

router.get('/', authenticate, validateQuery(notificationSchemas.query), notificationController.getNotifications);

router.get('/unread-count', authenticate, notificationController.getUnreadCount);

router.put('/:id/read', authenticate, validateParams(uuidParam), notificationController.markAsRead);

router.put('/read-all', authenticate, notificationController.markAllAsRead);

router.delete('/:id', authenticate, validateParams(uuidParam), notificationController.deleteNotification);

module.exports = router;
