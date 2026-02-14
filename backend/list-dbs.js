const { Client } = require('pg');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root1',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres', // Connect to default postgres DB
    port: parseInt(process.env.DB_PORT || '5432'),
};

async function list() {
    const client = new Client(config);
    try {
        await client.connect();
        const res = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
        console.log('Databases:', res.rows.map(r => r.datname));
        await client.end();
    } catch (err) {
        console.error('Failed:', err.message);
    }
}

list();
