require('dotenv').config();
const { User, Task, TaskComment, TaskAssignment } = require('./src/models');
const { sequelize } = require('./src/models');

async function check() {
    try {
        await sequelize.authenticate();

        // 1. Get Balu's latest comment
        const balu = await User.findOne({ where: { email: 'balu@gmail.com' } });
        if (!balu) {
            console.log('Balu not found');
            process.exit(1);
        }

        const comment = await TaskComment.findOne({
            where: { user_id: balu.id },
            order: [['created_at', 'DESC']]
        });

        if (!comment) {
            console.log('No comments from Balu found');
            process.exit(0);
        }

        // 2. Get Task details
        const task = await Task.findByPk(comment.task_id);
        if (!task) {
            console.log('Task not found');
            process.exit(1);
        }

        console.log(`Task Title: ${task.title}`);
        console.log(`Creator ID: ${task.created_by}`);

        const creator = await User.findByPk(task.created_by);
        console.log(`Creator Email: ${creator ? creator.email : 'Unknown'}`);

        // 3. Get Assigned Users
        const assignments = await TaskAssignment.findAll({
            where: { task_id: task.id },
            include: [{ model: User, as: 'user' }]
        });

        console.log('Assigned Users:');
        assignments.forEach(a => {
            console.log(`- ${a.user ? a.user.email : 'Unknown'} (${a.user_id})`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
