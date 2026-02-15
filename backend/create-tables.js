const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

const DATABASE_URL = 'postgresql://college_attendance_user:eI1lL7wLFLZEoC9pIx4sHrkytObsYcVW@dpg-d68290usb7us73c32n7g-a.oregon-postgres.render.com/task_management';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: { 
    ssl: { 
      require: true, 
      rejectUnauthorized: false 
    } 
  },
  logging: console.log
});

async function createTables() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected successfully\n');

    console.log('🔄 Creating all tables...');
    
    // Import all models
    const modelsPath = path.join(__dirname, 'src', 'models');
    const modelFiles = fs.readdirSync(modelsPath)
      .filter(file => file.endsWith('.js') && file !== 'index.js');

    console.log('📁 Found model files:', modelFiles);

    // Load each model
    const models = {};
    for (const file of modelFiles) {
      console.log(`Loading model: ${file}`);
      const model = require(path.join(modelsPath, file))(sequelize, Sequelize.DataTypes);
      models[model.name] = model;
    }

    // Set up associations
    Object.keys(models).forEach(modelName => {
      if (models[modelName].associate) {
        console.log(`Setting up associations for: ${modelName}`);
        models[modelName].associate(models);
      }
    });

    // Sync all models (force: true will drop tables if they exist and recreate them)
    await sequelize.sync({ force: true });
    console.log('✅ All tables created successfully!\n');

    // List created tables
    const [tables] = await sequelize.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`
    );

    console.log('📊 Tables created:');
    tables.forEach(t => console.log('   - ' + t.table_name));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

createTables();