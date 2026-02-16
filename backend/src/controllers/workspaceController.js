const { Workspace, WorkspaceMember, User, Project, ProjectMember, Task } = require('../models');
const { HTTP_STATUS, ERROR_MESSAGES, ROLES } = require('../../config/constants');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/helpers');
const logger = require('../utils/logger');
const { sequelize } = require('../models');

const createWorkspace = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { name } = req.validatedBody;
    const userId = req.user.id;

    const workspace = await Workspace.create(
      {
        name,
        created_by: userId,
      },
      { transaction }
    );

    await WorkspaceMember.create(
      {
        user_id: userId,
        workspace_id: workspace.id,
        role: ROLES.OWNER,
      },
      { transaction }
    );

    await transaction.commit();

    logger.info(`Workspace created: ${workspace.name} by ${req.user.email}`);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Workspace created successfully',
      data: workspace,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

const getWorkspaces = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit, offset } = getPaginationParams(req.query);

    // Get workspaces where user is a member
    const { count, rows } = await WorkspaceMember.findAndCountAll({
      where: { user_id: userId },
      include: [
        {
          model: Workspace,
          as: 'workspace',
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
            },
          ],
        },
      ],
      limit,
      offset,
      order: [['joined_at', 'DESC']],
    });

    const workspaces = rows.map(membership => ({
      ...membership.workspace.toJSON(),
      role: membership.role,
      joined_at: membership.joined_at,
    }));

    // Get member counts for each workspace
    const workspacesWithCounts = await Promise.all(
      workspaces.map(async (workspace) => {
        const memberCount = await WorkspaceMember.count({
          where: { workspace_id: workspace.id },
        });

        const projectCount = await Project.count({
          where: { workspace_id: workspace.id, is_completed: false },
        });

        const taskCount = await Task.count({
          include: [{
            model: Project,
            as: 'project',
            where: { workspace_id: workspace.id }
          }]
        });

        return {
          ...workspace,
          memberCount,
          projectCount,
          taskCount,
        };
      })
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...buildPaginatedResponse(workspacesWithCounts, page, limit, count),
    });
  } catch (error) {
    next(error);
  }
};

const getWorkspaceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is workspace member
    const membership = await WorkspaceMember.findOne({
      where: { workspace_id: id, user_id: userId },
    });

    if (!membership) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.NOT_WORKSPACE_MEMBER,
      });
    }

    const workspace = await Workspace.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
        },
        {
          model: Project,
          as: 'projects',
          attributes: ['id', 'name', 'description', 'is_completed', 'created_at'],
          where: { is_completed: false },
          required: false,
          limit: 5,
          order: [['created_at', 'DESC']],
        },
      ],
    });

    if (!workspace) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.WORKSPACE_NOT_FOUND,
      });
    }

    const memberCount = await WorkspaceMember.count({
      where: { workspace_id: id },
    });

    const projectCount = await Project.count({
      where: { workspace_id: id, is_completed: false },
    });

    const taskCount = await Task.count({
      include: [{
        model: Project,
        as: 'project',
        where: { workspace_id: id }
      }]
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        ...workspace.toJSON(),
        memberCount,
        projectCount,
        taskCount,
        role: membership.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateWorkspace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.validatedBody;
    const userId = req.user.id;

    const workspace = await Workspace.findByPk(id);

    if (!workspace) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.WORKSPACE_NOT_FOUND,
      });
    }

    // Check if user is workspace owner
    const membership = await WorkspaceMember.findOne({
      where: {
        workspace_id: id,
        user_id: userId,
        role: ROLES.OWNER,
      },
    });

    if (!membership) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only workspace owner can update workspace',
      });
    }

    workspace.name = name;
    await workspace.save();

    logger.info(`Workspace updated: ${workspace.name} by ${req.user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Workspace updated successfully',
      data: workspace,
    });
  } catch (error) {
    next(error);
  }
};

const deleteWorkspace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const workspace = await Workspace.findByPk(id);

    if (!workspace) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.WORKSPACE_NOT_FOUND,
      });
    }

    // Check if user is workspace owner
    const membership = await WorkspaceMember.findOne({
      where: {
        workspace_id: id,
        user_id: userId,
        role: ROLES.OWNER,
      },
    });

    if (!membership) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only workspace owner can delete workspace',
      });
    }

    await workspace.destroy();

    logger.info(`Workspace deleted: ${workspace.name} by ${req.user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Workspace deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getWorkspaceMembers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is workspace member
    const userMembership = await WorkspaceMember.findOne({
      where: { workspace_id: id, user_id: userId },
    });

    if (!userMembership) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.NOT_WORKSPACE_MEMBER,
      });
    }

    const members = await WorkspaceMember.findAll({
      where: { workspace_id: id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
        },
      ],
      order: [
        ['role', 'ASC'],
        ['joined_at', 'ASC'],
      ],
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: members.map((m) => ({
        id: m.id,
        userId: m.user_id,
        userCode: m.user.user_id,
        name: m.user.name,
        email: m.user.email,
        profileImage: m.user.profile_image,
        role: m.role,
        joined_at: m.joined_at,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const addWorkspaceMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.validatedBody;
    const currentUserId = req.user.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if current user is workspace owner/admin
    const currentUserMembership = await WorkspaceMember.findOne({
      where: {
        user_id: currentUserId,
        workspace_id: id,
        role: [ROLES.OWNER, ROLES.ADMIN],
      },
    });

    if (!currentUserMembership) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only workspace owners/admins can add members',
      });
    }

    const existingMembership = await WorkspaceMember.findOne({
      where: {
        user_id: userId,
        workspace_id: id,
      },
    });

    if (existingMembership) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'User is already a member of this workspace',
      });
    }

    const membership = await WorkspaceMember.create({
      user_id: userId,
      workspace_id: id,
      role: role || ROLES.MEMBER,
    });

    logger.info(`Member added to workspace: ${user.email} by ${req.user.email}`);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Member added successfully',
      data: membership,
    });
  } catch (error) {
    next(error);
  }
};

const addWorkspaceMemberByCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userCode, role } = req.validatedBody;
    const currentUserId = req.user.id;

    // Find user by user_id (5-digit code)
    const user = await User.findOne({
      where: {
        user_id: userCode.toUpperCase(),
        is_active: true
      },
    });

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User not found with this code',
      });
    }

    // Check if current user is workspace owner/admin
    const currentUserMembership = await WorkspaceMember.findOne({
      where: {
        user_id: currentUserId,
        workspace_id: id,
        role: [ROLES.OWNER, ROLES.ADMIN],
      },
    });

    if (!currentUserMembership) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only workspace owners/admins can add members',
      });
    }

    const existingMembership = await WorkspaceMember.findOne({
      where: {
        user_id: user.id,
        workspace_id: id,
      },
    });

    if (existingMembership) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'User is already a member of this workspace',
      });
    }

    const membership = await WorkspaceMember.create({
      user_id: user.id,
      workspace_id: id,
      role: role || ROLES.MEMBER,
    });

    // Send real-time notification
    if (global.websocketServer) {
      const workspace = await Workspace.findByPk(id);
      if (workspace) {
        global.websocketServer.sendToUser(user.id, {
          type: 'WORKSPACE_INVITE',
          data: {
            workspaceId: workspace.id,
            workspaceName: workspace.name,
            invitedBy: req.user.name,
            role: role || ROLES.MEMBER,
          },
        });
      }
    }

    logger.info(`Member added to workspace by code: ${user.email} by ${req.user.email}`);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Member added successfully',
      data: {
        ...membership.toJSON(),
        user: {
          id: user.id,
          user_id: user.user_id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateMemberRole = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.validatedBody;
    const currentUserId = req.user.id;

    // Check if current user is workspace owner/admin
    const currentUserMembership = await WorkspaceMember.findOne({
      where: {
        user_id: currentUserId,
        workspace_id: id,
        role: [ROLES.OWNER, ROLES.ADMIN],
      },
    });

    if (!currentUserMembership) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only workspace owners/admins can update member roles',
      });
    }

    const membership = await WorkspaceMember.findOne({
      where: {
        user_id: userId,
        workspace_id: id,
      },
    });

    if (!membership) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Membership not found',
      });
    }

    membership.role = role;
    await membership.save();

    logger.info(`Member role updated in workspace by ${req.user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Member role updated successfully',
      data: membership,
    });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const currentUserId = req.user.id;

    // Check if current user is workspace owner/admin
    const currentUserMembership = await WorkspaceMember.findOne({
      where: {
        user_id: currentUserId,
        workspace_id: id,
        role: [ROLES.OWNER, ROLES.ADMIN],
      },
    });

    if (!currentUserMembership) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only workspace owners/admins can remove members',
      });
    }

    const membership = await WorkspaceMember.findOne({
      where: {
        user_id: userId,
        workspace_id: id,
      },
    });

    if (!membership) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Membership not found',
      });
    }

    // Role hierarchy enforcement
    if (currentUserMembership.role === ROLES.ADMIN) {
      // Admin can only remove regular MEMBERS
      if (membership.role !== ROLES.MEMBER) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Admins can only remove regular members',
        });
      }
    }

    // Prevent removing the last owner
    if (membership.role === ROLES.OWNER) {
      const ownerCount = await WorkspaceMember.count({
        where: {
          workspace_id: id,
          role: ROLES.OWNER,
        },
      });

      if (ownerCount === 1) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Cannot remove the last owner of the workspace',
        });
      }
    }

    await membership.destroy();

    logger.info(`Member removed from workspace by ${req.user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceMembers,
  addWorkspaceMember,
  addWorkspaceMemberByCode,
  updateMemberRole,
  removeMember,
};