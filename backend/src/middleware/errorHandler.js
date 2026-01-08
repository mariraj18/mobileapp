const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../config/constants');

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  if (err.name === 'SequelizeValidationError') {
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_ERROR,
      errors: err.errors.map((e) => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: 'Duplicate entry',
      errors: err.errors.map((e) => ({
        field: e.path,
        message: `${e.path} must be unique`,
      })),
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Invalid reference to related resource',
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.UNAUTHORIZED,
      error: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.UNAUTHORIZED,
      error: 'Token expired',
    });
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'File too large',
        error: 'Maximum file size is 10MB',
      });
    }

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'File upload error',
      error: err.message,
    });
  }

  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || ERROR_MESSAGES.SERVER_ERROR;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
