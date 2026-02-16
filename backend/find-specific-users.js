require('dotenv').config();
const { User } = require('./src/models');
const { sequelize } = require('./src/models');

async function find() {
    try {
        await sequelize.authenticate();
        const emails = ['balu@gmail.com', 'mariraj@gmail.com'];
        for (const email of emails) {
            const user = await User.findOne({ where: { email } });
            if (user) {
                console.log(`USER_FOUND: ${user.email}`);
                console.log(`  ID: ${user.id}`);
                console.log(`  Push Token: ${user.push_token || 'NONE'}`);
            } else {
                console.log(`USER_NOT_FOUND: ${email}`);
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

find();
