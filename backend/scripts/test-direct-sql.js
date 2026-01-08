require('dotenv').config();
const { sequelize } = require('../src/models');

async function testDirectCreate() {
    try {
        console.log('Testing direct SQL user creation...\n');

        // First, let's test if we can manually set user_id
        const testUserId = 'TEST1';
        const testEmail = 'directtest@example.com';

        // Clean up if exists
        await sequelize.query(
            `DELETE FROM users WHERE email = '${testEmail}'`
        );

        // Try direct SQL insert
        const [results] = await sequelize.query(`
      INSERT INTO users (id, user_id, name, email, password, is_active, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        '${testUserId}',
        'Direct Test',
        '${testEmail}',
        'hashedpassword',
        true,
        NOW(),
        NOW()
      )
      RETURNING *;
    `);

        console.log('✓ Direct SQL insert successful');
        console.log('  User ID:', results[0].user_id);
        console.log('  Email:', results[0].email);

        // Clean up
        await sequelize.query(
            `DELETE FROM users WHERE email = '${testEmail}'`
        );

        console.log('\n✓ Direct SQL test completed successfully');
        console.log('\nThis confirms the database schema is correct.');
        console.log('The issue is with the Sequelize hook execution.\n');

        process.exit(0);
    } catch (error) {
        console.error('\n✗ Test failed:', error.message);
        process.exit(1);
    }
}

testDirectCreate();
