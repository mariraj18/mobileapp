require('dotenv').config();
const { sequelize } = require('./src/models');
const fs = require('fs');

async function check() {
    const results = {};
    try {
        await sequelize.authenticate();

        // 1. Find Users
        results.users = await sequelize.query(
            "SELECT id, email, push_token FROM users WHERE email IN ('balu@gmail.com', 'mariraj@gmail.com')",
            { type: sequelize.QueryTypes.SELECT }
        );

        const mariraj = results.users.find(u => u.email === 'mariraj@gmail.com');
        const balu = results.users.find(u => u.email === 'balu@gmail.com');

        if (mariraj) {
            results.mariraj_notifs = await sequelize.query(
                `SELECT * FROM notifications WHERE user_id = '${mariraj.id}' ORDER BY created_at DESC LIMIT 10`,
                { type: sequelize.QueryTypes.SELECT }
            );
            results.mariraj_memberships = await sequelize.query(
                `SELECT p.name, pm.role, p.id FROM project_members pm JOIN projects p ON pm.project_id = p.id WHERE pm.user_id = '${mariraj.id}'`,
                { type: sequelize.QueryTypes.SELECT }
            );
        }

        if (balu) {
            results.balu_comments = await sequelize.query(
                `SELECT tc.*, t.title, t.created_by FROM task_comments tc JOIN tasks t ON tc.task_id = t.id WHERE tc.user_id = '${balu.id}' ORDER BY tc.created_at DESC LIMIT 5`,
                { type: sequelize.QueryTypes.SELECT }
            );

            if (results.balu_comments.length > 0) {
                const latest = results.balu_comments[0];
                results.latest_task_assignments = await sequelize.query(
                    `SELECT u.email FROM task_assignments ta JOIN users u ON ta.user_id = u.id WHERE ta.task_id = '${latest.task_id}'`,
                    { type: sequelize.QueryTypes.SELECT }
                );
            }
        }

        fs.writeFileSync('sql_results.json', JSON.stringify(results, null, 2));
        console.log('Results written to sql_results.json');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
