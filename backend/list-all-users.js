require('dotenv').config();
const { User } = require('./src/models');
const { sequelize } = require('./src/models');

async function list() {
    try {
        await sequelize.authenticate();
        const users = await User.findAll({ attributes: ['id', 'email', 'name', 'push_token'] });
        console.log(`--- TOTAL USERS: ${users.length} ---`);
        users.forEach(u => {
            console.log(`[${u.email}] ID: ${u.id} | Name: ${u.name} | PushToken: ${u.push_token ? 'YES (' + u.push_token.substring(0, 10) + '...)' : 'NO'}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

list();
