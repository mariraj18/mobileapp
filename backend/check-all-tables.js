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
    const client = new Client(config);
    try {
        await client.connect();
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', res.rows.map(r => r.table_name));
        await client.end();
    } catch (err) {
        console.error('Failed:', err.message);
    }
}

test();
