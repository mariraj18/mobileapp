const { ProjectMember, Project, User, WorkspaceMember } = require('../models');
const { HTTP_STATUS, ERROR_MESSAGES, NOTIFICATION_TYPES } = require('../../config/constants');
const logger = require('../utils/logger');
const { sequelize } = require('../models');
const { sendProjectInviteNotification, sendProjectRemovedNotification } = require('../utils/notificationService');

/**
 * Add member to project
 */
const addProjectMember = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { projectId } = req.params;
    const { userId } = req.body;
    const currentUserId = req.user.id;

    // Check if project exists
    const project = await Project.findByPk(projectId, {
      include: [{
        model: Workspace,
        as: 'workspace'
      }],
      transaction
    });

    if (!project) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is workspace admin/owner or project creator
    const workspaceMembership = await WorkspaceMember.findOne({
      where: {
        user_id: currentUserId,
        workspace_id: project.workspace_id,
        role: ['OWNER', 'ADMIN']
      },
      transaction
    });

    const isProjectCreator = project.created_by === currentUserId;

    if (!workspaceMembership && !isProjectCreator) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to add members to this project'
      });
    }

    // Check if user exists
    const userToAdd = await User.findByPk(userId, { transaction });
    if (!userToAdd) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already a member
    const existingMember = await ProjectMember.findOne({
      where: {
        project_id: projectId,
        user_id: userId
      },
      transaction
    });

    if (existingMember) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'User is already a member of this project'
      });
    }

    // Add member
    const projectMember = await ProjectMember.create({
      project_id: projectId,
      user_id: userId,
      added_by: currentUserId,
      added_at: new Date()
    }, { transaction });

    await transaction.commit();

    // Send notification to the added user
    await sendProjectInviteNotification(userId, projectId, currentUserId);

    logger.info(`User ${userToAdd.email} added to project ${project.name} by ${req.user.email}`);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Member added successfully',
      data: projectMember
    });

  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Remove member from project
 */
const removeProjectMember = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { projectId, userId } = req.params;
    const currentUserId = req.user.id;

    const project = await Project.findByPk(projectId, {
      include: [{
        model: Workspace,
        as: 'workspace'
      }],
      transaction
    });

    if (!project) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check permissions
    const workspaceMembership = await WorkspaceMember.findOne({
      where: {
        user_id: currentUserId,
        workspace_id: project.workspace_id,
        role: ['OWNER', 'ADMIN']
      },
      transaction
    });

    const isProjectCreator = project.created_by === currentUserId;

    if (!workspaceMembership && !isProjectCreator && currentUserId !== userId) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to remove members from this project'
      });
    }

    // Don't allow removing the project creator
    if (userId === project.created_by) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Cannot remove the project creator'
      });
    }

    const projectMember = await ProjectMember.findOne({
      where: {
        project_id: projectId,
        user_id: userId
      },
      transaction
    });

    if (!projectMember) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Member not found in project'
      });
    }

    await projectMember.destroy({ transaction });
    await transaction.commit();

    // Send notification that user was removed
    if (currentUserId !== userId) {
      await sendProjectRemovedNotification(userId, projectId, currentUserId);
    }

    logger.info(`User ${userId} removed from project ${project.name} by ${req.user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Get project members
 */
const getProjectMembers = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const members = await ProjectMember.findAll({
      where: { project_id: projectId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'profile_image', 'user_id']
      }, {
        model: User,
        as: 'addedByUser',
        attributes: ['id', 'name', 'email']
      }],
      order: [['added_at', 'DESC']]
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: members
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  addProjectMember,
  removeProjectMember,
  getProjectMembers
};