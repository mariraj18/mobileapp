require('dotenv').config();
const { sequelize } = require('./src/models');

async function check() {
    try {
        await sequelize.authenticate();

        // 1. Get Balu's ID
        const [balu] = await sequelize.query("SELECT id FROM users WHERE email = 'balu@gmail.com'", { type: sequelize.QueryTypes.SELECT });
        if (!balu) { console.log('Balu not found'); process.exit(1); }

        // 2. Get Mariraj's ID
        const [mariraj] = await sequelize.query("SELECT id FROM users WHERE email = 'mariraj@gmail.com'", { type: sequelize.QueryTypes.SELECT });
        if (!mariraj) { console.log('Mariraj not found'); process.exit(1); }

        // 3. Get Balu's latest comment and task
        const [comment] = await sequelize.query(
            `SELECT tc.*, t.title, t.created_by FROM task_comments tc JOIN tasks t ON tc.task_id = t.id WHERE tc.user_id = '${balu.id}' ORDER BY tc.created_at DESC LIMIT 1`,
            { type: sequelize.QueryTypes.SELECT }
        );

        if (!comment) {
            console.log('No comments from Balu found');
            process.exit(0);
        }

        console.log(`Task Title: ${comment.title}`);
        console.log(`Creator ID: ${comment.created_by}`);

        const [creator] = await sequelize.query(`SELECT email FROM users WHERE id = '${comment.created_by}'`, { type: sequelize.QueryTypes.SELECT });
        console.log(`Creator Email: ${creator ? creator.email : 'Unknown'}`);

        // 4. Get Assignments
        const assignments = await sequelize.query(
            `SELECT u.email, u.id FROM task_assignments ta JOIN users u ON ta.user_id = u.id WHERE ta.task_id = '${comment.task_id}'`,
            { type: sequelize.QueryTypes.SELECT }
        );

        console.log('Assignments:');
        assignments.forEach(a => console.log(`- ${a.email} (${a.id})`));

        const isMarirajCreator = comment.created_by === mariraj.id;
        const isMarirajAssigned = assignments.some(a => a.id === mariraj.id);

        console.log(`--- Result ---`);
        console.log(`Is Mariraj Creator: ${isMarirajCreator}`);
        console.log(`Is Mariraj Assigned: ${isMarirajAssigned}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
