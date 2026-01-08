require('dotenv').config();
const { User } = require('../src/models');

const debugUsers = async () => {
    try {
        const users = await User.findAll({ attributes: ['id', 'email', 'name', 'profile_image'] });
        console.log(`Found ${users.length} users.`);
        users.forEach(u => {
            console.log('------------------------------------------------');
            console.log(`ID: ${u.id}`);
            console.log(`Email: ${u.email}`);
            console.log(`Name: ${u.name}`);
            console.log(`Image Type: ${typeof u.profile_image}`);
            console.log(`Image Length: ${u.profile_image ? u.profile_image.length : 'NULL/Undefined'}`);
            if (u.profile_image) console.log(`Preview: ${u.profile_image.substring(0, 30)}...`);
        });
    } catch (error) {
        console.error('DB Error:', error);
    }
};

debugUsers();
