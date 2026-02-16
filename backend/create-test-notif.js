require('dotenv').config();
const { Notification, User } = require('./src/models');
const { NOTIFICATION_TYPES } = require('./config/constants');
const { sequelize } = require('./src/models');

async function test() {
    try {
        await sequelize.authenticate();

        const users = await User.findAll();

        for (const user of users) {
            await Notification.create({
                user_id: user.id,
                type: NOTIFICATION_TYPES.COMMENT,
                message: `System Test: Notifications are working for ${user.email}!`,
                data: {
                    test: true,
                    timestamp: new Date().toISOString()
                },
                is_read: false
            });
            console.log(`Created test notification for ${user.email}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

test();
