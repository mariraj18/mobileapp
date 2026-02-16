require('dotenv').config();
const { User, Notification } = require('./src/models');
const { sequelize } = require('./src/models');

async function list() {
    try {
        await sequelize.authenticate();
        const users = await User.findAll({ attributes: ['id', 'email', 'push_token'] });
        console.log('--- USERS ---');
        users.forEach(u => {
            console.log(`${u.email} | ID: ${u.id} | Token: ${u.push_token}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

list();
