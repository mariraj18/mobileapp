require('dotenv').config();
const { sequelize } = require('../src/models');

const testSql = async () => {
    try {
        const [results, metadata] = await sequelize.query(
            "UPDATE users SET profile_image = 'SQL_TEST_STRING' WHERE email LIKE '%@gmail.com' RETURNING id, email, profile_image"
        );
        console.log('Update Result:', results);
    } catch (error) {
        console.error('SQL Error:', error);
    }
};

testSql();
