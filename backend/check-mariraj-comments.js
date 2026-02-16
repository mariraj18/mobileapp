require('dotenv').config();
const { Notification, User } = require('./src/models');
const fs = require('fs');

async function check() {
    try {
        const user = await User.findOne({ where: { email: 'mariraj@gmail.com' } });
        if (!user) return console.log('User not found');

        const notifications = await Notification.findAll({
            where: {
                user_id: user.id,
                type: 'COMMENT'
            },
            order: [['created_at', 'DESC']],
            limit: 10
        });

        fs.writeFileSync('mariraj_comment_notifs.json', JSON.stringify(notifications, null, 2));
        console.log(`Found ${notifications.length} comment notifications. Written to mariraj_comment_notifs.json`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
