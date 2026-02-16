const { TaskComment, User, Task, Project, WorkspaceMember, Notification } = require('../models');
const { HTTP_STATUS, ERROR_MESSAGES, NOTIFICATION_TYPES } = require('../../config/constants');
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

    // Notify task creator and assigned users (except the commenter)
    const usersToNotify = new Set();

    // Add task creator
    if (task.created_by !== userId) {
      usersToNotify.add(task.created_by);
    }

    // Add assigned users
    const assignedUsers = await task.getAssignedUsers({ transaction });
    assignedUsers.forEach(user => {
      if (user.id !== userId) {
        usersToNotify.add(user.id);
      }
    });

    // Add parent comment user if replying
    if (parentComment && parentComment.user_id !== userId) {
      usersToNotify.add(parentComment.user_id);
    }

    // Add replied user if specified
    if (replyTo && replyTo !== userId) {
      usersToNotify.add(replyTo);
    }

    // Send notifications
    for (const notifyUserId of usersToNotify) {
      sendNotification({
        user_id: notifyUserId,
        task_id: taskId,
        type: NOTIFICATION_TYPES.COMMENT,
        message: parentId
          ? `${req.user.name} replied to a comment on task: "${task.title}"`
          : `${req.user.name} commented on task: "${task.title}"`,
        data: {
          taskId: task.id,
          taskTitle: task.title,
          commentId: comment.id,
          projectId: task.project?.id || null,
          projectName: task.project?.name || 'Personal Task',
        },
      });
    }

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