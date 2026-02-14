const { TaskJob } = require('../models');
const logger = require('./logger');

/**
 * Publishes a job to the database-backed queue.
 * @param {string} type - The job type (e.g., 'notification').
 * @param {object} data - The payload for the job.
 */
const publishTask = async (type, data) => {
    try {
        const job = await TaskJob.create({
            type,
            data,
            status: 'PENDING',
        });
        logger.info(`Job queued: ${type} with ID: ${job.id}`);
        return job.id;
    } catch (error) {
        logger.error(`Failed to queue job ${type}: ${error.message}`);
        console.error('Queue Error Stack:', error.stack);
        // We don't throw here to avoid failing the API request just because background task failed to queue
    }
};

const startQueue = async () => {
    // No-op for DB-backed queue initialization on producer side
    logger.info('Custom DB-backed queue initialized');
};

module.exports = {
    publishTask,
    startQueue,
};
