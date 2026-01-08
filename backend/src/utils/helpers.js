const jwt = require('jsonwebtoken');

const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d' }
  );
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const sanitizeUser = (user) => {
  const { password, ...sanitized } = user.toJSON ? user.toJSON() : user;
  return sanitized;
};

const getPaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

const buildPaginatedResponse = (data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

const isDueSoon = (dueDate, hoursThreshold = 24) => {
  if (!dueDate) return false;
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due - now;
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours > 0 && diffHours <= hoursThreshold;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  sanitizeUser,
  getPaginationParams,
  buildPaginatedResponse,
  isOverdue,
  isDueSoon,
};
