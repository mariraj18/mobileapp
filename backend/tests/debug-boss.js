const { publishTask, startQueue, boss } = require('../src/utils/queue');
require('dotenv').config();

async function run() {
    console.log('Starting...');
    try {
        await startQueue();
        console.log('Boss started');

        const data = { test: true };
        console.log('Sending job to "notification"...');
        // Using boss.send directly to see if it makes a difference
        const id = await boss.send('notification', data);
        console.log('Job sent, ID:', id);
    } catch (err) {
        console.error('--- ERROR CAUGHT ---');
        console.error('Message:', err.message);
        console.error('Stack:', err.stack);
        if (err.inner) console.error('Inner Error:', err.inner);
    }
    process.exit(0);
}

run();
