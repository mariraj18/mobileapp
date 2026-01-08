const { User } = require('../models');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  sanitizeUser,
} = require('../utils/helpers');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../config/constants');
const logger = require('../utils/logger');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.validatedBody;

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: ERROR_MESSAGES.USER_EXISTS,
      });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    logger.info(`User registered: ${user.email}`);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;

    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.validPassword(password))) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS,
      });
    }

    if (!user.is_active) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Account is inactive',
      });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    logger.info(`User logged in: ${user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Login successful',
      data: {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const refreshTokenController = async (req, res, next) => {
  try {
    const { refreshToken } = req.validatedBody;

    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded || decoded.type !== 'refresh') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        error: 'Invalid refresh token',
      });
    }

    const user = await User.findByPk(decoded.id);

    if (!user || !user.is_active) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: sanitizeUser(req.user),
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = req.user;

    logger.info(`Update Profile Request for ${user.email}`);
    logger.info(`Body keys: ${Object.keys(req.body).join(', ')}`);
    if (req.body.profile_image) {
      logger.info(`Profile Image received, length: ${req.body.profile_image.length}`);
    } else {
      logger.info('No profile_image in request body');
    }

    logger.info(`[CONTROLLER] updateProfile called for ${user.email}`);
    logger.info(`[CONTROLLER] Payload keys: ${Object.keys(req.body).join(', ')}`);

    if (req.body.name) {
      user.name = req.body.name;
    }

    if (req.body.profile_image) {
      logger.info(`[CONTROLLER] profile_image received. Length: ${req.body.profile_image.length}`);
      user.profile_image = req.body.profile_image;
    } else {
      logger.warn(`[CONTROLLER] profile_image MISSING in body. Body typically contains: ${Object.keys(req.body).join(', ')}`);
    }
    await user.save();

    // Reload to ensure we return the full user object including the new profile_image
    await user.reload();

    logger.info(`Profile updated successfully for ${user.email}, Has Image: ${!!user.profile_image}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profile updated successfully',
      data: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    logger.info(`User logged out: ${req.user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

const getUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { Workspace, Project, Task, WorkspaceMember } = require('../models');

    const [projectCount, taskCount, workspaceCount] = await Promise.all([
      // Count projects created by user (or member?) - usually "Projects" in profile implies visibility
      // Simplest: Projects in workspaces I'm a member of? Or just projects I created? 
      // The user request is "real count". Let's assume "Projects" = Projects I have access to? 
      // Or "My Projects"? 
      // Let's go with "Projects where I am a creator or maybe member" -> user model usually doesn't have project membership directly unless distinct table?
      // Checking models... I'll check models next. For now, let's assume we can count projects where user is creator for now to be safe, or check workspace membership.
      // Actually, let's look at `WorkspaceMember`. Access to workspace = access to projects usually?
      // Let's count "Assigned Tasks" for task count.
      // Let's count "Workspaces" I am a member of.

      // Projects: Harder without project membership table. Let's count projects in workspaces I am member of.
      Project.count({
        include: [{
          model: Workspace,
          required: true,
          include: [{
            model: User,
            as: 'members',
            where: { id: userId },
            required: true
          }]
        }]
      }),

      // Tasks: Assigned to me
      Task.count({
        include: [{
          model: User,
          as: 'assignedUsers',
          where: { id: userId },
          required: true
        }]
      }),

      // Workspaces: Member of
      WorkspaceMember.count({
        where: { user_id: userId }
      })
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        projects: projectCount,
        tasks: taskCount,
        workspaces: workspaceCount
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshTokenController,
  getMe,
  updateProfile,
  logout,
  getUserStats,
};
