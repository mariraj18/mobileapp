require('dotenv').config();
const { sequelize } = require('../src/models');

async function checkTables() {
    try {
        console.log('Checking database tables...\n');

        const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

        console.log('Database tables:');
        results.forEach(row => console.log('  -', row.table_name));

        // Check users table specifically
        const [userColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

        console.log('\nUsers table columns:');
        userColumns.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

        console.log('\n✓ Database check completed');
        process.exit(0);
    } catch (error) {
        console.error('\n✗ Error:', error.message);
        process.exit(1);
    }
}

checkTables();
