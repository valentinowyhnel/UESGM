const { Client } = require('pg');

const connectionString = 'postgresql://postgres.qhsfspgjazmxwqirxzrs:etSPqTE%40fAKq9AM@aws-0-eu-central-1.pooler.supabase.com:5432/postgres';

const client = new Client({
    connectionString: connectionString,
});

async function testConnection() {
    try {
        console.log('Connecting to Supabase...');
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
