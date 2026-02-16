require('dotenv').config();
const { Task, TaskComment, User, TaskAssignment, ProjectMember } = require('./src/models');
const { sequelize } = require('./src/models');

async function check() {
    try {
        await sequelize.authenticate();

        const balu = await User.findOne({ where: { email: 'balu@gmail.com' } });
        const mariraj = await User.findOne({ where: { email: 'mariraj@gmail.com' } });

        if (!balu || !mariraj) {
            console.log(`Balu: ${balu ? 'Found' : 'Missing'}, Mariraj: ${mariraj ? 'Found' : 'Missing'}`);
            process.exit(1);
        }

        const latestComment = await TaskComment.findOne({
            where: { user_id: balu.id },
            order: [['created_at', 'DESC']],
            include: [{ model: Task, as: 'task' }]
        });

        if (!latestComment || !latestComment.task) {
            console.log('No recent comments by Balu found.');
            process.exit(1);
        }

        const task = latestComment.task;
        console.log(`Latest Comment by Balu: "${latestComment.content}"`);
        console.log(`Task: "${task.title}" (ID: ${task.id})`);
        console.log(`  Task Creator: ${task.created_by}`);

        const assigned = await TaskAssignment.findAll({
            where: { task_id: task.id },
            include: [{ model: User, as: 'user' }]
        });
        console.log(`  Assigned Users emails: ${assigned.map(a => a.user ? a.user.email : 'Unknown').join(', ')}`);

        const isMarirajCreator = task.created_by === mariraj.id;
        const isMarirajAssigned = assigned.some(a => a.user_id === mariraj.id);

        console.log(`Mariraj Status for this task:`);
        console.log(`  Is Creator: ${isMarirajCreator}`);
        console.log(`  Is Assigned: ${isMarirajAssigned}`);

        if (!isMarirajCreator && !isMarirajAssigned) {
            console.log('--- REASON FOUND ---');
            console.log('Mariraj is NOT the creator and NOT assigned to this task.');
            console.log('The backend logic ONLY notifies the Creator and Assigned Users.');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
