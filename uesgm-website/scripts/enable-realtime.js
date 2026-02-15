const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const realtimeSql = `
-- 1. Create the publication if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- 2. Add tables to the publication for real-time tracking
ALTER PUBLICATION supabase_realtime ADD TABLE "Census";
ALTER PUBLICATION supabase_realtime ADD TABLE "Event";
ALTER PUBLICATION supabase_realtime ADD TABLE "Project";
ALTER PUBLICATION supabase_realtime ADD TABLE "ContactMessage";
ALTER PUBLICATION supabase_realtime ADD TABLE "Newsletter";
ALTER PUBLICATION supabase_realtime ADD TABLE "Statistics";

-- 3. Set replica identity to full to get old data on update/delete
ALTER TABLE "Census" REPLICA IDENTITY FULL;
ALTER TABLE "Event" REPLICA IDENTITY FULL;
ALTER TABLE "ContactMessage" REPLICA IDENTITY FULL;
`;

async function enableRealtime() {
    try {
        console.log('Enabling Supabase Realtime for selected tables...');
        await client.connect();
        await client.query(realtimeSql);
        console.log('✅ Realtime synchronization enabled in the database!');
    } catch (err) {
        // If table already in publication, pg might throw
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Some tables were already in the publication.');
        } else {
            console.error('❌ Error enabling Realtime:', err.message);
        }
    } finally {
        await client.end();
    }
}

enableRealtime();
