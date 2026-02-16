require('dotenv').config();
const { sequelize } = require('./src/models');
const fs = require('fs');

async function check() {
    try {
        const [results] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'project_members'");
        fs.writeFileSync('project_members_schema.json', JSON.stringify(results, null, 2));
        console.log('Schema written to project_members_schema.json');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
