require('dotenv').config();
const { Notification, Task, Project, User } = require('./src/models');
const { sequelize } = require('./src/models');

async function test() {
    try {
        await sequelize.authenticate();

        // Find testing user
        const user = await User.findOne({ where: { email: 'testing@gmail.com' } });
        if (!user) {
            console.log('User testing@gmail.com not found');
            process.exit(1);
        }

        console.log(`Testing fetch for User: ${user.email} (${user.id})`);

        const countBefore = await Notification.count({ where: { user_id: user.id } });
        console.log(`Pre-existing notifications: ${countBefore}`);

        // Create a fresh test notification to be 100% sure
        await Notification.create({
            user_id: user.id,
            type: 'COMMENT',
            message: 'Direct DB Insert Test',
            data: { test: true },
            is_read: false
        });

        const { count, rows } = await Notification.findAndCountAll({
            where: { user_id: user.id },
            include: [
                {
                    model: Task,
                    as: 'task',
                    attributes: ['id', 'title', 'status', 'project_id'],
                    required: false,
                },
                {
                    model: Project,
                    as: 'project',
                    attributes: ['id', 'name', 'workspace_id'],
                    required: false,
                },
            ],
            order: [['created_at', 'DESC']],
        });

        console.log(`Fetched ${rows.length} notifications (Total count: ${count})`);
        rows.forEach(r => {
            console.log(`- [${r.type}] ${r.message}`);
            if (r.task) console.log(`  Included Task: ${r.task.title}`);
            if (r.project) console.log(`  Included Project: ${r.project.name}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('FETCH_ERROR:', err);
        process.exit(1);
    }
}

test();
