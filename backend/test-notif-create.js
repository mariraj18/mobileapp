require('dotenv').config();
const { Notification, User, Task } = require('./src/models');
const { sequelize } = require('./src/models');

async function test() {
    try {
        const mariraj = await User.findOne({ where: { email: 'mariraj@gmail.com' } });
        const task = await Task.findOne({ where: { project_id: { [require('sequelize').Op.ne]: null } } });

        console.log(`Creating notification for Mariraj on Task ${task.id} (Project: ${task.project_id})`);

        const notif = await Notification.create({
            user_id: mariraj.id,
            task_id: task.id,
            project_id: task.project_id,
            type: 'COMMENT',
            message: 'Isolated test of project comment notification',
            data: { taskId: task.id, projectName: 'Test' }
        });

        console.log('Success! Notification ID:', notif.id);
        process.exit(0);
    } catch (err) {
        console.error('FAILED to create notification:', err.message);
        if (err.name === 'SequelizeValidationError') {
            console.log('Validation Errors:', err.errors.map(e => e.message));
        }
        process.exit(1);
    }
}

test();
