const { Notification, User } = require('../models');
const logger = require('./logger');
const { Expo } = require('expo-server-sdk');

// Initialize Expo SDK
let expo;
try {
  expo = new Expo({ 
    accessToken: process.env.EXPO_ACCESS_TOKEN 
  });
  logger.info('Expo SDK initialized successfully');
} catch (error) {
  logger.error('Failed to initialize Expo SDK:', error);
}

/**
 * Sends a push notification directly to Expo
 */
const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  if (!expoPushToken) {
    logger.warn('No push token provided');
    return null;
  }

  if (!Expo.isExpoPushToken(expoPushToken)) {
    logger.warn(`Invalid Expo push token: ${expoPushToken}`);
    return null;
  }

  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
    priority: 'high',
    channelId: 'default',
    badge: 1,
  };

  logger.info(`Sending push notification to: ${expoPushToken}`);
  logger.info(`Message: ${JSON.stringify(message)}`);

  try {
    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];

    for (let chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
        logger.info(`Push notification sent successfully: ${JSON.stringify(ticketChunk)}`);
      } catch (error) {
        logger.error(`Error sending push chunk: ${error.message}`);
      }
    }

    // Handle receipts
    for (let ticket of tickets) {
      if (ticket.status === 'error') {
        logger.error(`Push ticket error: ${JSON.stringify(ticket)}`);
        
        if (ticket.details && ticket.details.error === 'DeviceNotRegistered') {
          logger.warn(`Device not registered, clearing token: ${expoPushToken}`);
          await User.update(
            { push_token: null },
            { where: { push_token: expoPushToken } }
          );
        }
      } else {
        logger.info(`Push ticket success: ${ticket.id}`);
      }
    }

    return tickets;
  } catch (error) {
    logger.error(`Error in sendPushNotification: ${error.message}`);
    return null;
  }
};

/**
 * Main notification function - Creates in-app notification AND sends push
 */
const sendNotification = async ({ user_id, task_id, project_id, type, message, data }) => {
  try {
    logger.info(`[sendNotification] Starting for user: ${user_id}, type: ${type}`);

    // Get user with push token
    const user = await User.findByPk(user_id, {
      attributes: ['id', 'push_token', 'name', 'email']
    });

    if (!user) {
      logger.warn(`[sendNotification] User ${user_id} not found`);
      return null;
    }

    // 1. Create in-app notification
    const notification = await Notification.create({
      user_id,
      task_id,
      project_id,
      type,
      message,
      data,
    });

    logger.info(`[sendNotification] In-app notification created with id: ${notification.id}`);

    // 2. Send push notification if user has token
    if (user.push_token) {
      logger.info(`[sendNotification] User has push token: ${user.push_token}`);
      
      // Determine title based on type
      let title = 'Taskflow Update';
      switch (type) {
        case 'PROJECT_INVITE':
          title = '📋 Project Invitation';
          break;
        case 'TASK_ASSIGNMENT':
        case 'ASSIGNMENT':
          title = '✅ New Task';
          break;
        case 'COMMENT':
          title = '💬 New Comment';
          break;
        case 'PROJECT_COMPLETED':
          title = '🎉 Project Completed';
          break;
        case 'DUE_DATE':
          title = '⏰ Due Soon';
          break;
        default:
          title = 'Taskflow Notification';
      }

      // Send push
      const pushData = {
        notificationId: notification.id,
        type: type,
        taskId: task_id,
        projectId: project_id,
        ...data
      };

      await sendPushNotification(user.push_token, title, message, pushData);
    } else {
      logger.warn(`[sendNotification] User ${user_id} has no push token, skipping push`);
    }

    return notification;
  } catch (error) {
    logger.error(`[sendNotification] Failed: ${error.message}`);
    logger.error(error.stack);
    return null;
  }
};

/**
 * Send project invite notification
 */
const sendProjectInviteNotification = async (userId, projectId, addedByUserId) => {
  try {
    logger.info(`[sendProjectInviteNotification] Sending to user: ${userId} for project: ${projectId}`);
    
    const project = await Project.findByPk(projectId, { 
      attributes: ['id', 'name'] 
    });
    
    const addedByUser = await User.findByPk(addedByUserId, { 
      attributes: ['name'] 
    });

    if (!project || !addedByUser) {
      logger.error('[sendProjectInviteNotification] Project or user not found');
      return;
    }

    await sendNotification({
      user_id: userId,
      project_id: projectId,
      type: 'PROJECT_INVITE',
      message: `${addedByUser.name} added you to project: "${project.name}"`,
      data: {
        projectId: project.id,
        projectName: project.name,
        addedBy: addedByUser.name,
        addedById: addedByUserId,
        action: 'view_project'
      }
    });
  } catch (error) {
    logger.error(`[sendProjectInviteNotification] Failed: ${error.message}`);
  }
};

// Export all functions
module.exports = {
  sendNotification,
  sendPushNotification,
  sendProjectInviteNotification,
  // Add other notification functions as needed
};