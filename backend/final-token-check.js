require('dotenv').config();
const { User } = require('./src/models');
const { sequelize } = require('./src/models');

async function check() {
    try {
        await sequelize.authenticate();
        const users = await User.findAll({ attributes: ['id', 'email', 'push_token'] });
        console.log('--- Current Token Status ---');
        users.forEach(u => {
            console.log(`${u.email}: ${u.push_token ? 'TOKEN_PRESENT' : 'NULL'}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
