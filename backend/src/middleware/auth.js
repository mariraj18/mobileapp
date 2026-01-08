const passport = require('passport');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../config/constants');

const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.SERVER_ERROR,
        error: err.message,
      });
    }

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        error: info?.message || 'Invalid or expired token',
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

const optionalAuthenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};

module.exports = {
  authenticate,
  optionalAuthenticate,
};
