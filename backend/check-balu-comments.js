require('dotenv').config();
const { TaskComment, User, Task, TaskAssignment } = require('./src/models');
const { sequelize } = require('./src/models');

async function check() {
    try {
        await sequelize.authenticate();

        const balu = await User.findOne({ where: { email: 'balu@gmail.com' } });
        const mariraj = await User.findOne({ where: { email: 'mariraj@gmail.com' } });

        if (!balu) console.log('Balu not found');
        if (!mariraj) console.log('Mariraj not found');

        if (balu) {
            const recentComments = await TaskComment.findAll({
                where: { user_id: balu.id },
                limit: 5,
                order: [['created_at', 'DESC']],
                include: [{ model: Task, as: 'task' }]
            });

            console.log(`Recent comments by Balu (${balu.id}):`);
            for (const comment of recentComments) {
                console.log(`- Task: "${comment.task ? comment.task.title : 'Unknown'}" (ID: ${comment.task_id})`);
                console.log(`  Content: "${comment.content}"`);

                if (comment.task) {
                    const creator = await User.findByPk(comment.task.created_by);
                    const assignments = await TaskAssignment.findAll({
                        where: { task_id: comment.task.id },
                        include: [{ model: User, as: 'user' }]
                    });

                    console.log(`  Task Creator: ${creator ? creator.email : 'Unknown'}`);
                    console.log(`  Assigned Users: ${assignments.map(a => a.user ? a.user.email : 'Unknown').join(', ')}`);
                }
                console.log('---');
            }
        }

        if (mariraj) {
            console.log(`Mariraj Push Token: ${mariraj.push_token || 'MISSING'}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
