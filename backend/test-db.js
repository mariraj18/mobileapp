const { Client } = require('pg');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root1',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'task_management',
    port: parseInt(process.env.DB_PORT || '5432'),
};

async function test() {
    console.log('Testing connection with config:', { ...config, password: '****' });
    const client = new Client(config);
    try {
        await client.connect();
        console.log('Connected successfully!');
        const res = await client.query('SELECT current_database(), current_user');
        console.log('Current DB/User:', res.rows[0]);

        const schemaRes = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'pgboss'");
        console.log('pgboss schema exists:', schemaRes.rowCount > 0);

        await client.end();
    } catch (err) {
        console.error('Connection failed:', err.message);
        process.exit(1);
    }
}

test();
