const { TaskJob, Notification } = require('./src/models');
const logger = require('./src/utils/logger');
const { Op } = require('sequelize');

async function processNotification(job) {
    const { user_id, task_id, type, message, data } = job.data;
    await Notification.create({
        user_id,
        task_id,
        type,
        message,
        data,
    });
    logger.info(`[Worker] Notification processed for user: ${user_id}`);
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
