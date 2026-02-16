const { Notification, User } = require('./src/models');
const { sequelize } = require('./src/models');

async function check() {
    try {
        await sequelize.authenticate();

        const users = await User.findAll({ attributes: ['id', 'email', 'name'] });
        console.log('--- Users and Notification Counts ---');

        for (const user of users) {
            const count = await Notification.count({ where: { user_id: user.id } });
            const unread = await Notification.count({ where: { user_id: user.id, is_read: false } });
            console.log(`${user.email} (${user.id}): Total: ${count}, Unread: ${unread}`);
        }

        console.log('\n--- Latest 3 Notifications in DB ---');
        const latest = await Notification.findAll({
            limit: 3,
            order: [['created_at', 'DESC']],
            include: [{ model: User, as: 'user', attributes: ['email'] }]
        });

        latest.forEach(n => {
            console.log(`To: ${n.user ? n.user.email : 'Unknown'}`);
            console.log(`Type: ${n.type}, Data: ${n.data ? 'PRESENT' : 'NULL'}`);
            console.log(`Message: ${n.message}`);
            console.log('---');
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

check();
