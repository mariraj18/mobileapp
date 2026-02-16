const { TaskJob, Notification, User } = require('./src/models');
const logger = require('./src/utils/logger');
const { Op } = require('sequelize');
const { Expo } = require('expo-server-sdk');

// Initialize Expo SDK with access token if available
const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

async function processNotification(job) {
    const { user_id, task_id, project_id, type, message, data } = job.data;

    // Create the in-app notification record
    const notification = await Notification.create({
        user_id,
        task_id,
        project_id,
        type,
        message,
        data,
    });

    logger.info(`[Worker] In-app notification created for user: ${user_id}`);

    // Try to send push notification
    try {
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
                    const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                    logger.info(`[Worker] Push notification sent to user: ${user_id}`);
                    // NOTE: In a production app, you might want to store and check receipt IDs later
                } catch (error) {
                    logger.error(`[Worker] Error sending push notification chunk: ${error.message}`);
                }
            }
        } else {
            logger.info(`[Worker] User ${user_id} has no valid push token, skipping push alert.`);
        }
    } catch (error) {
        logger.error(`[Worker] Failed push notification process: ${error.message}`);
    }
}

async function processActivityLog(job) {
    const { level, message } = job.data;
    if (logger[level]) {
        logger[level](`[WORKER-LOG] ${message}`);
    } else {
        logger.info(`[WORKER-LOG] ${message}`);
    }
}

const processors = {
    'notification': processNotification,
    'activity-log': processActivityLog,
};

async function work() {
    logger.info('Worker service started - Polling for jobs...');

    while (true) {
        try {
            // Find and lock a pending job
            const job = await TaskJob.findOne({
                where: { status: 'PENDING' },
                order: [['created_at', 'ASC']],
            });

            if (job) {
                // Mark as processing
                job.status = 'PROCESSING';
                job.last_attempt_at = new Date();
                job.attempts += 1;
                await job.save();

                try {
                    const processor = processors[job.type];
                    if (processor) {
                        await processor(job);
                        job.status = 'COMPLETED';
                        job.completed_at = new Date();
                    } else {
                        throw new Error(`No processor found for job type: ${job.type}`);
                    }
                } catch (err) {
                    logger.error(`[Worker] Job ${job.id} failed: ${err.message}`);
                    job.status = 'FAILED';
                    job.error = err.stack;
                }
                await job.save();
            } else {
                // No jobs found, wait a bit
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        } catch (error) {
            logger.error(`[Worker] Polling error: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

work().catch(err => {
    logger.error(`Worker crash: ${err.message}`);
    process.exit(1);
});
