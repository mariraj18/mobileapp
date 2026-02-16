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
            const pushMessages = [{
                to: user.push_token,
                sound: 'default',
                title: 'Taskflow Update',
                body: message,
                data: { ...data, notificationId: notification.id },
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
