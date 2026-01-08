const Joi = require('joi');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../config/constants');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors,
      });
    }

    req.validatedBody = value;
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors,
      });
    }

    req.validatedQuery = value;
    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors,
      });
    }

    req.validatedParams = value;
    next();
  };
};

module.exports = {
  validate,
  validateQuery,
  validateParams,
};
