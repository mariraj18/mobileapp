
const { Notification, User, Project, Task } = require('./backend/src/models');

const API_URL = 'http://localhost:5000/api/v1';

async function testNotificationAPI() {
    try {
        console.log('Testing Notification API...');

        // 1. Get a user (we need a token, but for now we'll assume we can just hit the endpoint if we had one, 
        // or we can test the model association directly which was the root cause)

        // Testing Model Association specifically since that was the error
        console.log('Verifying Notification model associations...');

        // Create a dummy project, user, task and notification
        // We'll rely on existing data if possible, or create temp ones.
        // Actually, the best test is to just check if the query that failed now works.
        // The query was: Notification.findAndCountAll({ include: [{ model: Project, as: 'project' }] })

        // We can try to simulate this query using the model directly
        try {
            const notifications = await Notification.findAndCountAll({
                include: [
                    {
                        model: Project,
                        as: 'project',
                        attributes: ['id', 'name'],
                        required: false
                    }
                ],
                limit: 1
            });
            console.log('✅ Successfully queried Notifications with Project inclusion!');
            console.log(`Found ${notifications.count} notifications.`);
        } catch (err) {
            console.error('❌ Failed to query Notifications with Project inclusion:', err.message);
            process.exit(1);
        }

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testNotificationAPI();
