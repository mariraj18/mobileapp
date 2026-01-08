const { publishTask, startQueue, boss } = require('../src/utils/queue');
const logger = require('../src/utils/logger');

async function verify() {
    console.log('Starting Queue Verification...');
    await startQueue();

    const testData = {
        user_id: '00000000-0000-0000-0000-000000000000',
        message: 'Test Notification',
        type: 'ASSIGNMENT'
    };

    console.log('Publishing test notification job...');
    const jobId = await publishTask('notification', testData);
    console.log(`Job published successfully with ID: ${jobId}`);

    console.log('Waiting for worker to (optionally) pick it up or just checking queue status...');

    // Note: This script doesn't start a subscriber, it just verifies publishing.
    // We will run the real worker in a separate terminal.

    console.log('Verification script finished. Running worker in a separate process is recommended.');
    process.exit(0);
}

verify().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});
