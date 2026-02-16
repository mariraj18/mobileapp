require('dotenv').config();
const { User, Notification } = require('./src/models');
const { NOTIFICATION_TYPES } = require('./config/constants');
const { sequelize } = require('./src/models');
const bcrypt = require('bcrypt');

async function setup() {
    try {
        await sequelize.authenticate();

        // Create new test user
        const email = 'notif-test@gmail.com';
        const password = 'password123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let user = await User.findOne({ where: { email } });
        if (!user) {
            user = await User.create({
                name: 'Notification Tester',
                email: email,
                password: hashedPassword,
                is_active: true
            });
            console.log(`Created new user: ${email}`);
        } else {
            user.password = hashedPassword;
            await user.save();
            console.log(`Updated existing user: ${email}`);
        }

        // Create test notification
        await Notification.create({
            user_id: user.id,
            type: NOTIFICATION_TYPES.COMMENT,
            message: 'Hello! This is a test notification for the Render DB.',
            data: {
                info: 'Verified on Render DB',
                sender: 'Antigravity'
            },
            is_read: false
        });

        console.log(`Notification created for ${email}. Login with:`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

setup();
