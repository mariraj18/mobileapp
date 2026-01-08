const express = require('express');
const router = express.Router();
const attachmentController = require('../controllers/attachmentController');
const { authenticate } = require('../middleware/auth');
const { canAccessTask } = require('../middleware/permissions');
const { validateParams } = require('../middleware/validation');
const { taskIdParam, uuidParam } = require('../utils/validators');
const { upload } = require('../utils/fileUpload');

router.post('/task/:taskId', authenticate, validateParams(taskIdParam), canAccessTask, upload.single('file'), attachmentController.uploadAttachment);

router.get('/task/:taskId', authenticate, validateParams(taskIdParam), canAccessTask, attachmentController.getAttachments);

router.get('/:id/download', authenticate, validateParams(uuidParam), attachmentController.downloadAttachment);

router.delete('/:id', authenticate, validateParams(uuidParam), attachmentController.deleteAttachment);

module.exports = router;
