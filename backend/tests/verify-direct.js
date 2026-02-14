const { TaskJob } = require('../src/models');
const { publishTask } = require('../src/utils/queue');

async function verify() {
    console.log('--- Direct Model Verification ---');
    try {
        console.log('TaskJob model:', !!TaskJob);
        if (!TaskJob) {
            console.error('TaskJob NOT FOUND in models');
            process.exit(1);
        }

        console.log('Attempting direct create...');
        const job = await TaskJob.create({
            type: 'notification',
            data: { test: 'direct' },
            status: 'PENDING'
        });
        console.log('Direct create success, ID:', job.id);

        console.log('\n--- Utility Verification ---');
        const jobId = await publishTask('notification', { test: 'utility' });
        console.log('Utility publish ID:', jobId);

        if (jobId) {
            console.log('Verification: OK');
        } else {
            console.log('Utility publish FAILED (returned undefined)');
            process.exit(1);
        }
    } catch (e) {
        console.error('Verification ERROR:', e);
        process.exit(1);
    }
    process.exit(0);
}

verify();
