require('dotenv').config();
const { Task, TaskComment, User, Project, ProjectMember, TaskAssignment, Notification } = require('./src/models');
const { sequelize } = require('./src/models');

async function simulate() {
    const transaction = await sequelize.transaction();
    try {
        const balu = await User.findOne({ where: { email: 'balu@gmail.com' } });
        if (!balu) throw new Error('Balu not found');
        const userId = balu.id;

        // Find a task to comment on
        const task = await Task.findOne({
            where: { project_id: { [require('sequelize').Op.ne]: null } },
            include: [{ model: Project, as: 'project' }]
        });

        if (!task) throw new Error('No project task found to simulate on');
        console.log(`Simulating comment on Task: "${task.title}" (ID: ${task.id})`);
        console.log(`Task Creator: ${task.created_by}`);

        const usersToNotify = new Set();
        if (task.created_by !== userId) {
            usersToNotify.add(task.created_by);
        }

        const assignedUsers = await task.getAssignedUsers({ transaction });
        console.log(`Assigned count: ${assignedUsers.length}`);
        assignedUsers.forEach(user => {
            if (user.id !== userId) {
                usersToNotify.add(user.id);
            }
        });

        if (task.project_id) {
            const projectMembers = await ProjectMember.findAll({
                where: { project_id: task.project_id },
                transaction
            });
            console.log(`Project members count: ${projectMembers.length}`);
            projectMembers.forEach(member => {
                if (member.user_id !== userId) {
                    usersToNotify.add(member.user_id);
                }
            });
        }

        console.log(`Total users to notify: ${usersToNotify.size}`);
        for (const notifyUserId of usersToNotify) {
            const user = await User.findByPk(notifyUserId);
            console.log(`- Notifying: ${user ? user.email : notifyUserId}`);

            const notif = await Notification.create({
                user_id: notifyUserId,
                task_id: task.id,
                project_id: task.project?.id || null,
                type: 'COMMENT',
                message: `Balu commented on task: "${task.title}"`,
                data: { taskId: task.id, taskTitle: task.title }
            }, { transaction });
            console.log(`  Notification created: ${notif.id}`);
        }

        await transaction.commit();
        console.log('Simulation complete. Transaction committed.');
        process.exit(0);
    } catch (err) {
        console.error('Simulation Failed:', err);
        if (transaction) await transaction.rollback();
        process.exit(1);
    }
}

simulate();
