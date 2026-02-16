require('dotenv').config();
const { User } = require('../src/models');

const usersToReset = [
    { email: 'mariraj@gmail.com', newPassword: 'testpass@1' },
    { email: 'mari@gmail.com', newPassword: 'testpass@2' },
    { email: 'marii@gmail.com', newPassword: 'testpass@3' },
    { email: 'mari2i@gmail.com', newPassword: 'testpass@4' },
    { email: 'mari1@gmail.com', newPassword: 'testpass@5' },
    { email: 'raj@gmail.com', newPassword: 'testpass@6' },
    { email: 'jon@gmail.com', newPassword: 'testpass@7' }
];

const bulkReset = async () => {
    try {
        console.log('🔄 Starting bulk password reset...\n');

        for (const item of usersToReset) {
            const user = await User.findOne({ where: { email: item.email } });
            if (user) {
                user.password = item.newPassword;
                await user.save();
                console.log(`✅ Reset password for: ${item.email} -> ${item.newPassword}`);
            } else {
                console.warn(`⚠️ User not found: ${item.email}`);
            }
        }

        console.log('\n🎉 Bulk password reset completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during bulk reset:', error);
        process.exit(1);
    }
};

bulkReset();
