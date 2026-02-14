const { Client } = require('pg');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root1',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'task_management',
    port: parseInt(process.env.DB_PORT || '5432'),
};

async function drop() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log('Dropping pgboss schema...');
        await client.query('DROP SCHEMA IF EXISTS pgboss CASCADE');
        console.log('Schema dropped successfully!');
        await client.end();
    } catch (err) {
        console.error('Failed to drop schema:', err.message);
        process.exit(1);
    }
}

drop();
