const { TaskComment, User, Task, Project, WorkspaceMember, Notification, ProjectMember, Workspace } = require('../models');
const { HTTP_STATUS, ERROR_MESSAGES, NOTIFICATION_TYPES, ROLES } = require('../../config/constants');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { sequelize } = require('../models');
const { sendNotification } = require('../utils/notificationService');

const createComment = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { taskId } = req.params;
    const { content, parentId, replyTo } = req.validatedBody;
    const userId = req.user.id;

    const task = await Task.findByPk(taskId, {
      include: [{
        model: Project,
        as: 'project',
        include: [{
          model: Workspace,
          as: 'workspace',
        }]
      }],
      transaction,
    });

    if (!task) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.TASK_NOT_FOUND,
      });
    }

    // Check if project is completed
    if (task.project_id && task.project?.is_completed) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_COMPLETED,
      });
    }

    let parentComment = null;
    if (parentId) {
      parentComment = await TaskComment.findByPk(parentId, { transaction });
      if (!parentComment) {
        await transaction.rollback();
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Parent comment not found',
        });
      }
    }

    const comment = await TaskComment.create({
      task_id: taskId,
      user_id: userId,
      content,
      parent_id: parentId || null,
      reply_to: replyTo || null,
    }, { transaction });

    // Fetch the created comment with user details
    const createdComment = await TaskComment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
        },
        {
          model: User,
          as: 'replyToUser',
          attributes: ['id', 'user_id', 'name', 'email'],
          required: false,
        },
      ],
      transaction,
    });

    // Notify task creator, assigned users, and project members (except the commenter)
    const usersToNotify = new Set();
    const commenterIdStr = String(userId);

    // Debug info gathering
    const debugLogs = [];
    debugLogs.push(`[${new Date().toISOString()}] Creating comment for task: ${taskId} by user: ${userId}`);

    // Add task creator
    if (String(task.created_by) !== commenterIdStr) {
      usersToNotify.add(String(task.created_by));
      debugLogs.push(`Added creator: ${task.created_by}`);
    }

    // Add assigned users
    const assignedUsers = await task.getAssignedUsers({ transaction });
    debugLogs.push(`Found ${assignedUsers.length} assigned users`);
    assignedUsers.forEach(user => {
      const idStr = String(user.id);
      if (idStr !== commenterIdStr) {
        usersToNotify.add(idStr);
        debugLogs.push(`Added assignee: ${idStr}`);
      }
    });

    // Add all project members if it's a project task
    if (task.project_id) {
      debugLogs.push(`Project task: ${task.project_id}. Fetching members...`);
      const projectMembers = await ProjectMember.findAll({
        where: { project_id: task.project_id },
        transaction
      });
      debugLogs.push(`Found ${projectMembers.length} project members`);
      projectMembers.forEach(member => {
        const idStr = String(member.user_id);
        if (idStr !== commenterIdStr) {
          usersToNotify.add(idStr);
          debugLogs.push(`Added project member: ${idStr}`);
        }
      });

      // Add Workspace Owners (as requested: owner can see all project chats)
      if (task.project && task.project.workspace_id) {
        debugLogs.push(`Fetching workspace owners for workspace: ${task.project.workspace_id}`);
        const workspaceOwners = await WorkspaceMember.findAll({
          where: {
            workspace_id: task.project.workspace_id,
            role: ROLES.OWNER
          },
          transaction
        });
        debugLogs.push(`Found ${workspaceOwners.length} workspace owners`);
        workspaceOwners.forEach(owner => {
          const idStr = String(owner.user_id);
          if (idStr !== commenterIdStr) {
            usersToNotify.add(idStr);
            debugLogs.push(`Added workspace owner: ${idStr}`);
          }
        });
      }
    }

    // Add parent comment user if replying
    if (parentComment && String(parentComment.user_id) !== commenterIdStr) {
      usersToNotify.add(String(parentComment.user_id));
      debugLogs.push(`Added parent commenter: ${parentComment.user_id}`);
    }

    // Add replied user if specified
    if (replyTo && String(replyTo) !== commenterIdStr) {
      usersToNotify.add(String(replyTo));
      debugLogs.push(`Added replied user: ${replyTo}`);
    }

    debugLogs.push(`Total unique recipients: ${usersToNotify.size}`);

    // Write debug logs to a file in the background (no await needed for the API response)
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(process.cwd(), 'comment_debug.log');
    fs.appendFileSync(logPath, debugLogs.join('\n') + '\n---\n');

    // Send notifications
    const notificationPromises = [];
    for (const notifyUserId of usersToNotify) {
      notificationPromises.push(
        sendNotification({
          user_id: notifyUserId,
          task_id: taskId,
          project_id: task.project_id || null,
          type: NOTIFICATION_TYPES.COMMENT,
          message: parentId
            ? `${req.user.name} replied to a comment on task: "${task.title}"`
            : `${req.user.name} commented on task: "${task.title}"`,
          data: {
            taskId: task.id,
            taskTitle: task.title,
            commentId: comment.id,
            projectId: task.project_id || null,
            projectName: task.project?.name || 'Personal Task',
          },
        })
      );
    }

    await Promise.all(notificationPromises);

    await transaction.commit();

    logger.info(`Comment created on task: ${task.title} by ${req.user.email}`);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Comment created successfully',
      data: createdComment,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

const getComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const comments = await TaskComment.findAll({
      where: { task_id: taskId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
        },
        {
          model: User,
          as: 'replyToUser',
          attributes: ['id', 'user_id', 'name', 'email'],
          required: false,
        },
        {
          model: TaskComment,
          as: 'replies',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
          }],
        },
      ],
      order: [
        ['created_at', 'ASC'],
        [{ model: TaskComment, as: 'replies' }, 'created_at', 'ASC'],
      ],
    });

    // Structure comments hierarchically
    const commentMap = new Map();
    const rootComments = [];

    comments.forEach(comment => {
      commentMap.set(comment.id, {
        ...comment.toJSON(),
        replies: [],
      });
    });

    comments.forEach(comment => {
      const commentObj = commentMap.get(comment.id);
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(commentObj);
        }
      } else {
        rootComments.push(commentObj);
      }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: rootComments,
    });
  } catch (error) {
    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.validatedBody;
    const userId = req.user.id;

    const comment = await TaskComment.findByPk(id, {
      include: [{
        model: Task,
        as: 'task',
        include: [{
          model: Project,
          as: 'project',
        }],
      }],
    });

    if (!comment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check if project is completed
    if (comment.task.project_id && comment.task.project?.is_completed) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_COMPLETED,
      });
    }

    if (comment.user_id !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You can only edit your own comments',
      });
    }

    comment.content = content;
    await comment.save();

    logger.info(`Comment updated by ${req.user.email}`);

    const updatedComment = await TaskComment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
        },
      ],
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Comment updated successfully',
      data: updatedComment,
    });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await TaskComment.findByPk(id, {
      include: [{
        model: Task,
        as: 'task',
        include: [{
          model: Project,
          as: 'project',
        }],
      }],
    });

    if (!comment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check if project is completed
    if (comment.task.project_id && comment.task.project?.is_completed) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_COMPLETED,
      });
    }

    // Allow deletion if user is comment creator or workspace admin
    let workspaceMembership = null;
    if (comment.task.project_id) {
      workspaceMembership = await WorkspaceMember.findOne({
        where: {
          user_id: userId,
          workspace_id: comment.task.project.workspace_id,
          role: ['OWNER', 'ADMIN'],
        },
      });
    }

    if (comment.user_id !== userId && !workspaceMembership) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to delete this comment',
      });
    }

    await comment.destroy();

    logger.info(`Comment deleted by ${req.user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComment,
  getComments,
  updateComment,
  deleteComment,
};