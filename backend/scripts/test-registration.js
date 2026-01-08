require('dotenv').config();
const { User } = require('../src/models');

async function testRegistration() {
    try {
        console.log('Testing user registration...\n');

        // Clean up test user if exists
        await User.destroy({ where: { email: 'test@example.com' } });

        console.log('Creating user with:');
        console.log('  name: Test User');
        console.log('  email: test@example.com');
        console.log('  password: password123\n');

        // Create test user
        const user = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        });

        console.log('✓ User created successfully');
        console.log('  ID:', user.id);
        console.log('  User ID:', user.user_id);
        console.log('  Email:', user.email);
        console.log('  Name:', user.name);

        // Verify user_id is generated
        if (!user.user_id) {
            throw new Error('user_id was not generated!');
        }

        console.log('\n✓ user_id generated successfully');
        console.log('✓ user_id length:', user.user_id.length);

        // Clean up
        await user.destroy();
        console.log('\n✓ Test completed successfully');

        process.exit(0);
    } catch (error) {
        console.error('\n✗ Test failed:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        if (error.errors) {
            console.error('\nValidation errors:');
            error.errors.forEach(err => {
                console.error(`  - ${err.path}: ${err.message} (type: ${err.type})`);
                console.error(`    Value: ${err.value}`);
            });
        }
        console.error('\nFull error:', error);
        process.exit(1);
    }
}

testRegistration();
