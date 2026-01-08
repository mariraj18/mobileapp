const { User } = require('../models');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../config/constants');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

const findByCode = async (req, res, next) => {
  try {
    const { userCode } = req.params;

    const user = await User.findOne({
      where: { 
        user_id: userCode.toUpperCase(),
        is_active: true 
      },
      attributes: ['id', 'user_id', 'name', 'email', 'profile_image', 'created_at'],
    });

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User not found with this code',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const { query, excludeCurrent = true } = req.query;
    const userId = req.user.id;

    if (!query || query.trim().length < 2) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
    }

    const whereClause = {
      [Op.or]: [
        { name: { [Op.iLike]: `%${query}%` } },
        { email: { [Op.iLike]: `%${query}%` } },
        { user_id: { [Op.iLike]: `%${query.toUpperCase()}%` } },
      ],
      is_active: true,
    };

    if (excludeCurrent === 'true') {
      whereClause.id = { [Op.ne]: userId };
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
      limit: 20,
      order: [['name', 'ASC']],
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['id', 'user_id', 'name', 'email', 'profile_image', 'created_at'],
    });

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  findByCode,
  searchUsers,
  getUserProfile,
};