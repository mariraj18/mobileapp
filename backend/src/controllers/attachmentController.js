const { TaskAttachment, Task } = require('../models');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../config/constants');
const { deleteFile } = require('../utils/fileUpload');
const logger = require('../utils/logger');
const path = require('path');

const uploadAttachment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const task = await Task.findByPk(taskId);

    if (!task) {
      await deleteFile(req.file.path);
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.TASK_NOT_FOUND,
      });
    }

    const attachment = await TaskAttachment.create({
      task_id: taskId,
      file_path: req.file.path,
      original_filename: req.file.originalname,
      file_size: req.file.size,
      file_type: req.file.mimetype,
      uploaded_by: userId,
    });

    logger.info(`Attachment uploaded for task ${taskId} by ${req.user.email}`);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Attachment uploaded successfully',
      data: {
        id: attachment.id,
        original_filename: attachment.original_filename,
        file_size: attachment.file_size,
        file_type: attachment.file_type,
        uploaded_at: attachment.uploaded_at,
      },
    });
  } catch (error) {
    if (req.file) {
      await deleteFile(req.file.path).catch(() => {});
    }
    next(error);
  }
};

const getAttachments = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const attachments = await TaskAttachment.findAll({
      where: { task_id: taskId },
      attributes: [
        'id',
        'original_filename',
        'file_size',
        'file_type',
        'uploaded_by',
        'uploaded_at',
      ],
      order: [['uploaded_at', 'DESC']],
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: attachments,
    });
  } catch (error) {
    next(error);
  }
};

const downloadAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const attachment = await TaskAttachment.findByPk(id);

    if (!attachment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Attachment not found',
      });
    }

    res.download(attachment.file_path, attachment.original_filename, (err) => {
      if (err) {
        logger.error('Error downloading file:', err);
        if (!res.headersSent) {
          return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error downloading file',
          });
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const deleteAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const attachment = await TaskAttachment.findByPk(id);

    if (!attachment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Attachment not found',
      });
    }

    if (attachment.uploaded_by !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN,
      });
    }

    await deleteFile(attachment.file_path).catch((err) => {
      logger.warn(`Failed to delete file: ${err.message}`);
    });

    await attachment.destroy();

    logger.info(`Attachment deleted by ${req.user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadAttachment,
  getAttachments,
  downloadAttachment,
  deleteAttachment,
};
