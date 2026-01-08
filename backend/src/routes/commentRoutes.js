const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');
const { canAccessTask } = require('../middleware/permissions');
const { validate, validateParams } = require('../middleware/validation');
const { commentSchemas, taskIdParam, uuidParam } = require('../utils/validators');

router.post('/task/:taskId', authenticate, validateParams(taskIdParam), canAccessTask, validate(commentSchemas.create), commentController.createComment);

router.get('/task/:taskId', authenticate, validateParams(taskIdParam), canAccessTask, commentController.getComments);

router.put('/:id', authenticate, validateParams(uuidParam), validate(commentSchemas.update), commentController.updateComment);

router.delete('/:id', authenticate, validateParams(uuidParam), commentController.deleteComment);

module.exports = router;
