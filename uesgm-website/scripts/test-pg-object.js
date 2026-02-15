const { Client } = require('pg');

const client = new Client({
    user: 'postgres.qhsfspgjazmxwqirxzrs',
    password: 'etSPqTE@fAKq9AM',
    host: 'aws-1-eu-west-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    ssl: {
        rejectUnauthorized: false
    }
});

async function testConnection() {
    try {
        console.log('Connecting to Supabase (IPv4 Pooler - Port 5432)...');
        await client.connect();
        console.log('✅ Connected successfully!');
        const res = await client.query('SELECT NOW()');
        console.log('Database time:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('❌ Connection error:', err.message);
        console.error('Stack trace:', err.stack);
        process.exit(1);
    }
}

testConnection();
