require('dotenv').config();
const { sequelize } = require('./src/models');

async function check() {
    try {
        const [results] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications'");
        console.log('--- NOTIFICATIONS TABLE COLUMNS ---');
        console.log(results);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
