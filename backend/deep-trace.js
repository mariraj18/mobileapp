require('dotenv').config();
const { Task, Project, ProjectMember, User, TaskComment } = require('./src/models');
const { sequelize } = require('./src/models');
const fs = require('fs');

async function trace() {
    const transaction = await sequelize.transaction();
    try {
        const balu = await User.findOne({ where: { email: 'balu@gmail.com' } });
        const taskId = (await Task.findOne({ where: { project_id: { [require('sequelize').Op.ne]: null } } })).id;
        const userId = balu.id;

        console.log(`Tracing Recipients for Task ${taskId}, User Balu (${userId})`);

        const task = await Task.findByPk(taskId, {
            include: [{ model: Project, as: 'project' }],
            transaction
        });

        const debug = {
            task_id: task.id,
            project_id: task.project_id,
            project_populated: !!task.project,
            recipients: []
        };

        const usersToNotify = new Set();
        if (task.created_by !== userId) {
            usersToNotify.add(task.created_by);
            debug.recipients.push({ type: 'creator', id: task.created_by });
        }

        const assignedUsers = await task.getAssignedUsers({ transaction });
        debug.assigned_count = assignedUsers.length;
        assignedUsers.forEach(u => {
            if (u.id !== userId) {
                usersToNotify.add(u.id);
                debug.recipients.push({ type: 'assignee', id: u.id });
            }
        });

        if (task.project_id) {
            const pm = await ProjectMember.findAll({ where: { project_id: task.project_id }, transaction });
            debug.pm_count = pm.length;
            pm.forEach(m => {
                debug.recipients.push({ type: 'pm_raw', user_id: m.user_id });
                if (m.user_id !== userId) {
                    usersToNotify.add(m.user_id);
                    debug.recipients.push({ type: 'pm_added', id: m.user_id });
                }
            });
        }

        debug.total_unique = usersToNotify.size;
        fs.writeFileSync('recipient_trace.json', JSON.stringify(debug, null, 2));
        console.log('Trace written to recipient_trace.json');
        await transaction.rollback();
    } catch (err) {
        console.error(err);
        if (transaction) await transaction.rollback();
    }
}

trace();
