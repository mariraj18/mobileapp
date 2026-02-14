const { WorkspaceMember, Project, Task } = require('../models');
const { ROLES, HTTP_STATUS, ERROR_MESSAGES } = require('../../config/constants');

const isWorkspaceMember = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId || req.params.id;
    const userId = req.user.id;

    const membership = await WorkspaceMember.findOne({
      where: {
        user_id: userId,
        workspace_id: workspaceId,
      },
    });

    if (!membership) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.NOT_WORKSPACE_MEMBER,
      });
    }

    req.workspaceMembership = membership;
    next();
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      error: error.message,
    });
  }
};

const isWorkspaceOwner = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId || req.params.id;
    const userId = req.user.id;

    const membership = await WorkspaceMember.findOne({
      where: {
        user_id: userId,
        workspace_id: workspaceId,
        role: ROLES.OWNER,
      },
    });

    if (!membership) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN,
      });
    }

    req.workspaceMembership = membership;
    next();
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      error: error.message,
    });
  }
};

const isWorkspaceAdmin = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId || req.params.id;
    const userId = req.user.id;

    const membership = await WorkspaceMember.findOne({
      where: {
        user_id: userId,
        workspace_id: workspaceId,
      },
    });

    if (!membership || ![ROLES.OWNER, ROLES.ADMIN].includes(membership.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN,
      });
    }

    req.workspaceMembership = membership;
    next();
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      error: error.message,
    });
  }
};

const canAccessProject = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const userId = req.user.id;

    const project = await Project.findByPk(projectId);

    if (!project) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_NOT_FOUND,
      });
    }

    const membership = await WorkspaceMember.findOne({
      where: {
        user_id: userId,
        workspace_id: project.workspace_id,
      },
    });

    if (!membership) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN,
      });
    }

    req.project = project;
    req.workspaceMembership = membership;
    next();
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      error: error.message,
    });
  }
};

const canManageProject = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const userId = req.user.id;

    const project = await Project.findByPk(projectId);

    if (!project) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_NOT_FOUND,
      });
    }

    const membership = await WorkspaceMember.findOne({
      where: {
        user_id: userId,
        workspace_id: project.workspace_id,
      },
    });

    if (!membership || ![ROLES.OWNER, ROLES.ADMIN].includes(membership.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN,
      });
    }

    req.project = project;
    req.workspaceMembership = membership;
    next();
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      error: error.message,
    });
  }
};

const canAccessTask = async (req, res, next) => {
  try {
    const taskId = req.params.taskId || req.params.id;
    const userId = req.user.id;

    const task = await Task.findByPk(taskId, {
      include: [
        {
          model: Project,
          as: 'project',
        },
      ],
    });

    if (!task) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.TASK_NOT_FOUND,
      });
    }

    if (task.project_id) {
      if (!task.project) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.PROJECT_NOT_FOUND,
        });
      }
      const membership = await WorkspaceMember.findOne({
        where: {
          user_id: userId,
          workspace_id: task.project.workspace_id,
        },
      });

      if (!membership) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: ERROR_MESSAGES.FORBIDDEN,
        });
      }
      req.workspaceMembership = membership;
    } else {
      // Standalone task - check if user is creator or assigned
      const isCreator = task.created_by === userId;
      const isAssigned = await task.hasAssignedUser(userId);

      if (!isCreator && !isAssigned) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'You do not have permission to access this standalone task',
        });
      }
    }

    req.task = task;
    next();
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      error: error.message,
    });
  }
};

const canManageTask = async (req, res, next) => {
  try {
    const taskId = req.params.taskId || req.params.id;
    const userId = req.user.id;

    const task = await Task.findByPk(taskId, {
      include: [
        {
          model: Project,
          as: 'project',
        },
      ],
    });

    if (!task) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.TASK_NOT_FOUND,
      });
    }

    if (task.project_id) {
      if (!task.project) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.PROJECT_NOT_FOUND,
        });
      }
      const membership = await WorkspaceMember.findOne({
        where: {
          user_id: userId,
          workspace_id: task.project.workspace_id,
        },
      });

      if (!membership || ![ROLES.OWNER, ROLES.ADMIN].includes(membership.role)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: ERROR_MESSAGES.FORBIDDEN,
        });
      }
      req.workspaceMembership = membership;
    } else {
      // Standalone task - only creator can manage
      if (task.created_by !== userId) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'You do not have permission to manage this standalone task',
        });
      }
    }

    req.task = task;
    next();
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      error: error.message,
    });
  }
};

module.exports = {
  isWorkspaceMember,
  isWorkspaceOwner,
  isWorkspaceAdmin,
  canAccessProject,
  canManageProject,
  canAccessTask,
  canManageTask,
};
