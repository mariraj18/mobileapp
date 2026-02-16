const { Project, Workspace, Task, User, ProjectMember, WorkspaceMember, Notification } = require('../models');
const { HTTP_STATUS, ERROR_MESSAGES, NOTIFICATION_TYPES, ROLES } = require('../../config/constants');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/helpers');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { sequelize } = require('../models');

const createProject = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { workspaceId } = req.params;
    const { name, description, memberIds } = req.validatedBody;
    const userId = req.user.id;

    const workspace = await Workspace.findByPk(workspaceId);

    if (!workspace) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.WORKSPACE_NOT_FOUND,
      });
    }

    // Check if user is workspace owner or admin
    const membership = await WorkspaceMember.findOne({
      where: {
        user_id: userId,
        workspace_id: workspaceId,
      },
      transaction,
    });

    if (!membership || ![ROLES.OWNER, ROLES.ADMIN].includes(membership.role)) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only workspace owners and admins can create projects',
      });
    }

    const project = await Project.create({
      name,
      description,
      workspace_id: workspaceId,
      created_by: userId,
    }, { transaction });

    // Add creator as project member if selected or if no members specified
    const isCreatorSelected = memberIds && memberIds.includes(userId);
    const shouldAddCreator = !memberIds || memberIds.length === 0 || isCreatorSelected;

    if (shouldAddCreator) {
      await ProjectMember.create({
        project_id: project.id,
        user_id: userId,
        added_by: userId,
      }, { transaction });
    }

    // Add other members if specified
    if (memberIds && memberIds.length > 0) {
      // Filter out the creator as they were handled above
      const otherMemberIds = memberIds.filter(id => id !== userId);

      const projectMembers = otherMemberIds.map(memberId => ({
        project_id: project.id,
        user_id: memberId,
        added_by: userId,
      }));

      await ProjectMember.bulkCreate(projectMembers, { transaction });

      // Send notifications to added members
      for (const memberId of otherMemberIds) {
        const user = await User.findByPk(memberId, { transaction });
        if (user) {
          await Notification.create({
            user_id: memberId,
            project_id: project.id,
            type: NOTIFICATION_TYPES.PROJECT_INVITE,
            message: `You have been added to project: "${project.name}" in workspace "${workspace.name}"`,
            data: {
              projectId: project.id,
              projectName: project.name,
              workspaceId: workspace.id,
              workspaceName: workspace.name,
            },
          }, { transaction });
        }
      }
    }

    await transaction.commit();

    logger.info(`Project created: ${project.name} by ${req.user.email}`);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Project created successfully',
      data: project,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

const getProjects = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    const { page, limit, offset } = getPaginationParams(req.query);
    const { showCompleted = false } = req.query;

    // Check if user is workspace member
    const workspaceMembership = await WorkspaceMember.findOne({
      where: { user_id: userId, workspace_id: workspaceId },
    });

    if (!workspaceMembership) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.NOT_WORKSPACE_MEMBER,
      });
    }

    const whereClause = { workspace_id: workspaceId };

    if (!showCompleted) {
      whereClause.is_completed = false;
    }

    const { count, rows } = await Project.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
        },
        {
          model: ProjectMember,
          as: 'memberships',
          attributes: ['id'],
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
          }],
        },
        {
          model: User,
          as: 'completedBy',
          attributes: ['id', 'user_id', 'name', 'email'],
          required: false,
        },
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    const projectsWithTaskCount = await Promise.all(
      rows.map(async (project) => {
        const taskCount = await Task.count({
          where: { project_id: project.id },
        });

        const completedTaskCount = await Task.count({
          where: { project_id: project.id, status: 'DONE' },
        });

        const memberCount = await ProjectMember.count({
          where: { project_id: project.id },
        });

        const isMember = await ProjectMember.findOne({
          where: { project_id: project.id, user_id: userId },
        });

        const isOwnerOrAdmin = [ROLES.OWNER, ROLES.ADMIN].includes(workspaceMembership.role);

        return {
          ...project.toJSON(),
          taskCount,
          completedTaskCount,
          memberCount,
          isMember: !!isMember || isOwnerOrAdmin || project.created_by === userId,
        };
      })
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...buildPaginatedResponse(projectsWithTaskCount, page, limit, count),
    });
  } catch (error) {
    next(error);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await Project.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
        },
        {
          model: Workspace,
          as: 'workspace',
          attributes: ['id', 'name'],
        },
        {
          model: ProjectMember,
          as: 'memberships',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
          }],
        },
        {
          model: User,
          as: 'completedBy',
          attributes: ['id', 'user_id', 'name', 'email'],
          required: false,
        },
      ],
    });

    if (!project) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_NOT_FOUND,
      });
    }

    // Check if user is project member or has workspace-level access
    const isMember = await ProjectMember.findOne({
      where: { project_id: id, user_id: userId },
    });

    const workspaceMembership = await WorkspaceMember.findOne({
      where: { user_id: userId, workspace_id: project.workspace_id },
    });

    const isOwnerOrAdmin = workspaceMembership && [ROLES.OWNER, ROLES.ADMIN].includes(workspaceMembership.role);
    const isCreator = project.created_by === userId;

    if (!isMember && !isOwnerOrAdmin && !isCreator) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You were not added to this project',
      });
    }

    const taskCount = await Task.count({
      where: { project_id: id },
    });

    const completedTaskCount = await Task.count({
      where: { project_id: id, status: 'DONE' },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        ...project.toJSON(),
        taskCount,
        completedTaskCount,
        isMember: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.validatedBody;
    const userId = req.user.id;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_NOT_FOUND,
      });
    }

    // Check if project is completed
    if (project.is_completed) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_COMPLETED,
      });
    }

    // Check if user is workspace owner/admin or project creator
    const workspaceMembership = await WorkspaceMember.findOne({
      where: {
        user_id: userId,
        workspace_id: project.workspace_id,
      },
    });

    if (!workspaceMembership || (![ROLES.OWNER, ROLES.ADMIN].includes(workspaceMembership.role) && project.created_by !== userId)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN,
      });
    }

    project.name = name || project.name;
    project.description = description || project.description;
    await project.save();

    logger.info(`Project updated: ${project.name} by ${req.user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Project updated successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

const completeProject = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await Project.findByPk(id);

    if (!project) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_NOT_FOUND,
      });
    }

    // Check if user is workspace owner/admin or project creator
    const workspaceMembership = await WorkspaceMember.findOne({
      where: {
        user_id: userId,
        workspace_id: project.workspace_id,
      },
      transaction,
    });

    if (!workspaceMembership || (![ROLES.OWNER, ROLES.ADMIN].includes(workspaceMembership.role) && project.created_by !== userId)) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only workspace owners/admins or project creator can complete the project',
      });
    }

    // Mark project as completed
    project.is_completed = true;
    project.completed_at = new Date();
    project.completed_by = userId;
    await project.save({ transaction });

    // Mark all tasks as completed
    await Task.update(
      { status: 'DONE' },
      {
        where: { project_id: id },
        transaction,
      }
    );

    // Notify all project members
    const projectMembers = await ProjectMember.findAll({
      where: { project_id: id },
      include: [{
        model: User,
        as: 'user',
      }],
      transaction,
    });

    for (const member of projectMembers) {
      if (member.user.id !== userId) {
        await Notification.create({
          user_id: member.user.id,
          type: NOTIFICATION_TYPES.PROJECT_COMPLETED,
          message: `Project "${project.name}" has been marked as completed`,
          data: {
            projectId: project.id,
            projectName: project.name,
            completedBy: req.user.name,
          },
        }, { transaction });
      }
    }

    await transaction.commit();

    logger.info(`Project completed: ${project.name} by ${req.user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Project marked as completed successfully',
      data: project,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

const reopenProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_NOT_FOUND,
      });
    }

    // Check if user is workspace owner/admin
    const workspaceMembership = await WorkspaceMember.findOne({
      where: {
        user_id: userId,
        workspace_id: project.workspace_id,
        role: [ROLES.OWNER, ROLES.ADMIN],
      },
    });

    if (!workspaceMembership) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only workspace owners/admins can reopen a project',
      });
    }

    project.is_completed = false;
    project.completed_at = null;
    project.completed_by = null;
    await project.save();

    logger.info(`Project reopened: ${project.name} by ${req.user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Project reopened successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_NOT_FOUND,
      });
    }

    // Check if user is project creator
    if (project.created_by !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only the project creator can delete this project',
      });
    }

    await project.destroy();

    logger.info(`Project deleted: ${project.name} by ${req.user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const addProjectMember = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { userId } = req.validatedBody;
    const currentUserId = req.user.id;

    const project = await Project.findByPk(id, { transaction });

    if (!project) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_NOT_FOUND,
      });
    }

    if (project.is_completed) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_COMPLETED,
      });
    }

    // Check if current user is workspace owner/admin
    const workspaceMembership = await WorkspaceMember.findOne({
      where: {
        user_id: currentUserId,
        workspace_id: project.workspace_id,
        role: [ROLES.OWNER, ROLES.ADMIN],
      },
      transaction,
    });

    if (!workspaceMembership) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only workspace owners/admins can add members to projects',
      });
    }

    // Check if user is already a member
    const existingMember = await ProjectMember.findOne({
      where: { project_id: id, user_id: userId },
      transaction,
    });

    if (existingMember) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'User is already a member of this project',
      });
    }

    // Add member
    await ProjectMember.create({
      project_id: id,
      user_id: userId,
      added_by: currentUserId,
    }, { transaction });

    // Send notification
    const user = await User.findByPk(userId, { transaction });
    const workspace = await Workspace.findByPk(project.workspace_id, { transaction });

    if (user) {
      await Notification.create({
        user_id: userId,
        type: NOTIFICATION_TYPES.PROJECT_INVITE,
        message: `You have been added to project: "${project.name}" in workspace "${workspace.name}"`,
        data: {
          projectId: project.id,
          projectName: project.name,
          workspaceId: workspace.id,
          workspaceName: workspace.name,
        },
      }, { transaction });
    }

    await transaction.commit();

    logger.info(`Member added to project: ${user.email} by ${req.user.email}`);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Member added successfully',
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

const removeProjectMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const currentUserId = req.user.id;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_NOT_FOUND,
      });
    }

    if (project.is_completed) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_COMPLETED,
      });
    }

    // Check if current user is project creator
    if (project.created_by !== currentUserId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only the project creator can remove members from this project',
      });
    }

    const result = await ProjectMember.destroy({
      where: { project_id: id, user_id: userId },
    });

    if (result === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Member not found in project',
      });
    }

    logger.info(`Member removed from project by ${req.user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getProjectMembers = async (req, res, next) => {
  try {
    const { id } = req.params;

    const members = await ProjectMember.findAll({
      where: { project_id: id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
        },
        {
          model: User,
          as: 'addedBy',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['added_at', 'ASC']],
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  completeProject,
  reopenProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  getProjectMembers,
};