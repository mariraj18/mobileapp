const PgBossMap = require('pg-boss');
const PgBoss = PgBossMap.PgBoss || PgBossMap.default || PgBossMap;
require('dotenv').config();
const logger = require('./logger');

const connectionString = `postgres://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'root1'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'task_management'}`;

const boss = new PgBoss(connectionString);

boss.on('error', error => logger.error(`pg-boss error: ${error.message}`));

let isStarted = false;

const startQueue = async () => {
    if (isStarted) return;
    try {
        await boss.start();
        isStarted = true;
        logger.info('pg-boss started successfully');
    } catch (error) {
        logger.error(`Failed to start pg-boss: ${error.message}`);
        console.error('PgBoss Start Error Details:', error);
    }
};

/**
 * Publishes a job to the queue.
 * @param {string} name - The name of the job/queue.
 * @param {object} data - The payload for the job.
 * @returns {Promise<string>} - The job ID.
 */
const publishTask = async (name, data) => {
    if (!isStarted) {
        await startQueue();
    }
    try {
        const jobId = await boss.send(name, data);
        logger.debug(`Job published: ${name} with ID: ${jobId}`);
        return jobId;
    } catch (error) {
        logger.error(`Failed to publish job ${name}: ${error.message}`);
        throw error;
    }
};

module.exports = {
    publishTask,
    startQueue,
    boss,
};
