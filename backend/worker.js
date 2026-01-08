const { Notification } = require('./src/models');
const logger = require('./src/utils/logger');
const { boss, startQueue } = require('./src/utils/queue');

async function work() {
    await startQueue();

    logger.info('Worker service started and listening for jobs...');

    // Notification Processor
    await boss.subscribe('notification', async (job) => {
        const { user_id, task_id, type, message, data } = job.data;
        try {
            await Notification.create({
                user_id,
                task_id,
                type,
                message,
                data,
            });
            logger.info(`Notification processed for user: ${user_id}`);
        } catch (error) {
            logger.error(`Failed to process notification: ${error.message}`);
            throw error; // Let pg-boss handle retry
        }
    });

    // Activity Log Processor
    await boss.subscribe('activity-log', async (job) => {
        const { level, message } = job.data;
        try {
            if (logger[level]) {
                logger[level](`[WORKER-LOG] ${message}`);
            } else {
                logger.info(`[WORKER-LOG] ${message}`);
            }
        } catch (error) {
            logger.error(`Failed to process activity log: ${error.message}`);
        }
    });
}

work().catch(err => {
    logger.error(`Worker crash: ${err.message}`);
    process.exit(1);
});
