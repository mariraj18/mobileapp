require('dotenv').config();
const { User } = require('./src/models');
const { sequelize } = require('./src/models');

async function list() {
    try {
        await sequelize.authenticate();
        const users = await User.findAll({ attributes: ['id', 'email', 'name'] });
        console.log(`Found ${users.length} users:`);
        users.forEach(u => console.log(`- ID: ${u.id} | Email: "${u.email}" | Name: ${u.name}`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

list();
