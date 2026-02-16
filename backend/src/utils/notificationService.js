const { Notification, User } = require('../models');
const logger = require('./logger');
const { Expo } = require('expo-server-sdk');

// Initialize Expo SDK with access token if available
const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

/**
 * Sends a notification directly (In-app DB record + Push alert)
 * @param {object} params - Notification parameters
 */
const sendNotification = async ({ user_id, task_id, project_id, type, message, data }) => {
    try {
        // 1. Create the in-app notification record
        const notification = await Notification.create({
            user_id,
            task_id,
            project_id,
            type,
            message,
            data,
        });

        logger.info(`[NotificationService] In-app notification created for user: ${user_id}`);

        // 2. Try to send push notification
        const user = await User.findByPk(user_id);

        if (user && user.push_token && Expo.isExpoPushToken(user.push_token)) {
            // Determine a better title based on notification type
            let pushTitle = 'Taskflow Update';
            if (type === 'PROJECT_INVITE') pushTitle = 'Project Invitation';
            if (type === 'ASSIGNMENT' || type === 'TASK_ASSIGNMENT') pushTitle = 'New Task Assigned';
            if (type === 'COMMENT') pushTitle = 'New Comment';
            if (data && data.type === 'WELCOME') pushTitle = 'Welcome to Taskflow!';
            if (data && data.type === 'WELCOME_BACK') pushTitle = 'Welcome Back!';

            const pushMessages = [{
                to: user.push_token,
                sound: 'default',
                title: pushTitle,
                body: message,
                data: { ...data, notificationId: notification.id },
                priority: 'high',
                channelId: 'default',
            }];

            const chunks = expo.chunkPushNotifications(pushMessages);
            for (let chunk of chunks) {
                try {
                    await expo.sendPushNotificationsAsync(chunk);
                    logger.info(`[NotificationService] Push notification sent to user: ${user_id}`);
                } catch (error) {
                    logger.error(`[NotificationService] Error sending push notification chunk: ${error.message}`);
                }
            }
        } else {
            logger.info(`[NotificationService] User ${user_id} has no valid push token, skipping push alert.`);
        }

        return notification;
    } catch (error) {
        logger.error(`[NotificationService] Failed to send notification: ${error.message}`);
        // We don't throw here to avoid crashing the main request
        return null;
    }
};

module.exports = {
    sendNotification,
};
