require('dotenv').config();
const { sequelize } = require('../src/models');

async function resetDatabase() {
    try {
        console.log('🔄 Starting database reset...');
        await sequelize.authenticate();
        console.log('✅ Connected to database.');

        // Force sync will drop tables and re-create them
        await sequelize.sync({ force: true });

        console.log('✅ Database reset complete. All tables have been dropped and recreated.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database reset failed:', error);
        process.exit(1);
    }
}

resetDatabase();
