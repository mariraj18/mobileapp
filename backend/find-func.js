const { Client } = require('pg');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root1',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'task_management',
    port: parseInt(process.env.DB_PORT || '5432'),
};

async function check() {
    const client = new Client(config);
    try {
        await client.connect();
        const res = await client.query(`
      SELECT n.nspname as schema, p.proname as name
      FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE p.proname = 'get_subscription_name'
    `);
        console.log('Search results:', res.rows);
        await client.end();
    } catch (err) {
        console.error('Failed:', err.message);
    }
}

check();
