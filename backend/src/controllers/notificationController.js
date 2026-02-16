const { Notification, Task, Project, User } = require('../models');
const { HTTP_STATUS, NOTIFICATION_TYPES } = require('../../config/constants');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/helpers');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { sendNotification } = require('../utils/notificationService');

// Import WebSocket server (make sure to pass it from app.js)
let websocketServer = null;

const setWebSocketServer = (server) => {
  websocketServer = server;
};


const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit, offset } = getPaginationParams(req.validatedQuery);
    const { unreadOnly, type } = req.validatedQuery;

    const whereClause = {
      user_id: userId,
    };

    if (unreadOnly) {
      whereClause.is_read = false;
    }

    if (type) {
      whereClause.type = type;
    }

    const { count, rows } = await Notification.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title', 'status', 'project_id'],
          required: false,
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'workspace_id'],
          required: false,
        },
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...buildPaginatedResponse(rows, page, limit, count),
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const count = await Notification.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!notification) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Notification not found',
      });
    }

    notification.is_read = true;
    await notification.save();

    // Send real-time update via WebSocket
    if (websocketServer) {
      websocketServer.sendToUser(userId, {
        type: 'NOTIFICATION_READ',
        data: { notificationId: id },
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [count] = await Notification.update(
      { is_read: true },
      {
        where: {
          user_id: userId,
          is_read: false,
        },
      }
    );

    logger.info(`${count} notifications marked as read for user ${req.user.email}`);

    // Send real-time update via WebSocket
    if (websocketServer) {
      websocketServer.sendToUser(userId, {
        type: 'ALL_NOTIFICATIONS_READ',
        data: { updatedCount: count },
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'All notifications marked as read',
      data: { updatedCount: count },
    });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!notification) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Notification not found',
      });
    }

    await notification.destroy();

    // Send real-time update via WebSocket
    if (websocketServer) {
      websocketServer.sendToUser(userId, {
        type: 'NOTIFICATION_DELETED',
        data: { notificationId: id },
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to send real-time notifications
const sendRealTimeNotification = async (userId, notificationData) => {
  try {
    // Call notification service directly
    await sendNotification({
      user_id: userId,
      ...notificationData,
    });

    // Note: WebSocket real-time update will be missing until moved to worker or handled here
    // For now we prioritize push and persistence via the service
    return true;
  } catch (error) {
    logger.error('Error sending real-time notification:', error);
    return null;
  }
};

// Send notification when user is added to project
const sendProjectInviteNotification = async (userId, projectId, addedByUserId) => {
  const project = await Project.findByPk(projectId);
  const addedByUser = await User.findByPk(addedByUserId);

  if (!project || !addedByUser) return;

  await sendRealTimeNotification(userId, {
    type: NOTIFICATION_TYPES.PROJECT_INVITE,
    message: `You have been added to project: "${project.name}"`,
    data: {
      projectId: project.id,
      projectName: project.name,
      addedBy: addedByUser.name,
      addedById: addedByUser.id,
    },
    is_read: false,
  });
};

// Send notification when task is assigned
const sendTaskAssignmentNotification = async (userId, taskId, assignedByUserId) => {
  const task = await Task.findByPk(taskId);
  const assignedByUser = await User.findByPk(assignedByUserId);

  if (!task || !assignedByUser) return;

  await sendRealTimeNotification(userId, {
    type: NOTIFICATION_TYPES.TASK_ASSIGNMENT,
    message: `You have been assigned to task: "${task.title}"`,
    data: {
      taskId: task.id,
      taskTitle: task.title,
      projectId: task.project_id,
      assignedBy: assignedByUser.name,
      assignedById: assignedByUser.id,
    },
    is_read: false,
  });
};

// Send notification when project is completed
const sendProjectCompletedNotification = async (userId, projectId, completedByUserId) => {
  const project = await Project.findByPk(projectId);
  const completedByUser = await User.findByPk(completedByUserId);

  if (!project || !completedByUser) return;

  await sendRealTimeNotification(userId, {
    type: NOTIFICATION_TYPES.PROJECT_COMPLETED,
    message: `Project "${project.name}" has been marked as completed`,
    data: {
      projectId: project.id,
      projectName: project.name,
      completedBy: completedByUser.name,
      completedById: completedByUser.id,
      completedAt: new Date().toISOString(),
    },
    is_read: false,
  });
};

const getDebugLogs = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(process.cwd(), 'comment_debug.log');

    if (!fs.existsSync(logPath)) {
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'No debug logs found',
        data: ''
      });
    }

    const logs = fs.readFileSync(logPath, 'utf8');
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};

const clearDebugLogs = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(process.cwd(), 'comment_debug.log');

    if (fs.existsSync(logPath)) {
      fs.unlinkSync(logPath);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Debug logs cleared'
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  setWebSocketServer,
  sendRealTimeNotification,
  sendProjectInviteNotification,
  sendTaskAssignmentNotification,
  sendProjectCompletedNotification,
  getDebugLogs,
  clearDebugLogs,
};