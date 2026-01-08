require('dotenv').config();
const { sequelize } = require('../src/models');
const logger = require('../src/utils/logger');

const syncDb = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully');

        // Force alter to ensure columns are added
        await sequelize.sync({ alter: true });
        console.log('Database synchronized successfully (alter: true)');

        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

syncDb();
