require('dotenv').config();
const { sequelize } = require('./src/models');
const fs = require('fs');

async function check() {
    try {
        const [results] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications'");
        fs.writeFileSync('notifications_schema.json', JSON.stringify(results, null, 2));
        console.log('Schema written to notifications_schema.json');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
