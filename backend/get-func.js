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
        // Get function definition
        const res = await client.query(`
      SELECT pg_get_functiondef(p.oid) 
      FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'pgboss' AND p.proname = 'get_subscription_name'
    `);
        if (res.rowCount > 0) {
            console.log('Function Definition:');
            console.log(res.rows[0].pg_get_functiondef);
        } else {
            console.log('Function pgboss.get_subscription_name NOT found.');
        }
        await client.end();
    } catch (err) {
        console.error('Failed:', err.message);
        process.exit(1);
    }
}

check();
