const { Sequelize } = require('sequelize');

const DATABASE_URL = "postgresql://college_attendance_user:eI1lL7wLFLZEoC9pIx4sHrkytObsYcVW@dpg-d68290usb7us73c32n7g-a.oregon-postgres.render.com/task_management";

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function checkTables() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected successfully\n');

    // Query to list all tables
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📊 Tables in database:');
    if (tables.length === 0) {
      console.log('❌ No tables found!');
    } else {
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    }

    // Check if migrations table exists
    const [migrations] = await sequelize.query(`
      SELECT * FROM information_schema.tables 
      WHERE table_name = 'SequelizeMeta';
    `);

    if (migrations.length > 0) {
      const [records] = await sequelize.query(`SELECT name FROM "SequelizeMeta" ORDER BY name;`);
      console.log('\n📝 Migrations run:');
      records.forEach(r => console.log(`   - ${r.name}`));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTables();