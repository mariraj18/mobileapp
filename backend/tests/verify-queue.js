const { publishTask } = require('../src/utils/queue');
const { TaskJob } = require('../src/models');
const logger = require('../src/utils/logger');

async function verify() {
    console.log('--- Custom Queue Verification ---');

    const testData = {
        user_id: '00000000-0000-0000-0000-000000000000',
        message: 'Test Notification from Custom Queue',
        type: 'ASSIGNMENT'
    };

    try {
        console.log('Publishing test job...');
        const jobId = await publishTask('notification', testData);
        console.log(`Job published successfully with ID: ${jobId}`);

        const job = await TaskJob.findByPk(jobId);
        if (job) {
            console.log('Job found in database:', job.toJSON());
            console.log('Verification: OK');
        } else {
            console.log('Job NOT found in database!');
            process.exit(1);
        }
    } catch (e) {
        console.error('Verification failed:', e);
        process.exit(1);
    }
    process.exit(0);
}

verify().catch(err => {
    console.error('Outer error:', err);
    process.exit(1);
});
