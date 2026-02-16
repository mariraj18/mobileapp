require('dotenv').config();
const { Notification, User, ProjectMember, Task } = require('./src/models');
const { sequelize } = require('./src/models');

async function check() {
    try {
        await sequelize.authenticate();

        const mariraj = await User.findOne({ where: { email: 'mariraj@gmail.com' } });
        if (!mariraj) {
            console.log('Mariraj not found');
            process.exit(1);
        }

        console.log(`Checking notifications for Mariraj (${mariraj.id}):`);
        const notifs = await Notification.findAll({
            where: { user_id: mariraj.id },
            limit: 10,
            order: [['created_at', 'DESC']]
        });

        console.log(`Found ${notifs.length} notifications.`);
        for (const n of notifs) {
            console.log(`- [${n.type}] ${n.message} (Read: ${n.is_read})`);
        }

        const memberships = await ProjectMember.findAll({
            where: { user_id: mariraj.id },
            include: [{ model: Task, as: 'project', association: 'Project' }] // Testing if association name is the issue
        });
        // Simplified membership check
        const rawMemberships = await sequelize.query(
            `SELECT pm.*, p.name FROM project_members pm JOIN projects p ON pm.project_id = p.id WHERE pm.user_id = '${mariraj.id}'`,
            { type: sequelize.QueryTypes.SELECT }
        );
        console.log(`Mariraj is member of projects: ${rawMemberships.map(m => m.name).join(', ')}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
