require('dotenv').config();
const { User } = require('./src/models');
const { sequelize } = require('./src/models');

async function find() {
    try {
        await sequelize.authenticate();
        const user = await User.findOne({ where: { email: 'subamari@gmail.com' } });
        if (user) {
            console.log(`FOUND_USER: ${user.id} | ${user.email}`);
        } else {
            console.log('USER_NOT_FOUND: subamari@gmail.com');
            const all = await User.findAll({ attributes: ['email'] });
            console.log('Available emails:', all.map(a => a.email).join(', '));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

find();
