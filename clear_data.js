const { sequelize } = require('./backend/src/models');

async function clearData() {
    try {
        console.log('Starting data cleanup...');

        // All known tables in the system
        const tables = [
            'comment_replies',
            'task_attachments',
            'task_comments',
            'task_assignments',
            'task_jobs',
            'notifications',
            'tasks',
            'project_members',
            'projects',
            'workspace_members',
            'workspaces',
            'users'
        ];

        console.log('Truncating tables:', tables.join(', '));

        // Use TRUNCATE with CASCADE to handle dependencies and RESTART IDENTITY to reset IDs
        await sequelize.query(`TRUNCATE TABLE ${tables.map(t => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`);

        console.log('SUCCESS: All data has been cleared. Table structures remain intact.');
    } catch (error) {
        console.error('Error clearing data:', error);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

clearData();
