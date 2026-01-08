require('dotenv').config();
const { User } = require('../src/models');

const checkUser = async () => {
    try {
        // Targeted check for the specific user ID seen in logs
        const user = await User.findOne({
            where: { id: 'eff6420a-2ff4-4ce6-8990-3090f0375009' },
            attributes: ['id', 'email', 'name', 'profile_image']
        });

        if (user) {
            console.log('User Found:', user.email);
            console.log('Name:', user.name);
            if (user.profile_image) {
                console.log('Profile Image Found!');
                console.log('Length:', user.profile_image.length);
                console.log('Preview:', user.profile_image.substring(0, 50));
            } else {
                console.log('No Profile Image found.');
            }
        } else {
            console.log('No users found.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkUser();
