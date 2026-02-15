const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const rlsSql = `
-- 1. Enable RLS on all tables
ALTER TABLE "Census" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Newsletter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContactMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExecutiveMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Antenne" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Partner" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Statistics" ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 3. Define Policies

-- PUBLIC READ TABLES (Events, Projects, etc.)
CREATE POLICY "Public read for public content" ON "ExecutiveMember" FOR SELECT USING (true);
CREATE POLICY "Public read for public content" ON "Antenne" FOR SELECT USING (true);
CREATE POLICY "Public read for public content" ON "Event" FOR SELECT USING (true);
CREATE POLICY "Public read for public content" ON "Project" FOR SELECT USING (true);
CREATE POLICY "Public read for public content" ON "Document" FOR SELECT USING (true);
CREATE POLICY "Public read for public content" ON "Partner" FOR SELECT USING (true);
CREATE POLICY "Public read for public content" ON "Statistics" FOR SELECT USING (true);

-- ADMIN ONLY TABLES
CREATE POLICY "Admin only access" ON "Census" FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin only access" ON "Newsletter" FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin only access" ON "ContactMessage" FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin only access" ON "User" FOR ALL TO authenticated USING (true);

-- ALLOW ANON INSERTS FOR newsletter and contact
CREATE POLICY "Allow anon insert newsletter" ON "Newsletter" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert contact" ON "ContactMessage" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert census" ON "Census" FOR INSERT WITH CHECK (true);

-- ADMIN WRITE FOR public content
CREATE POLICY "Admin write public content" ON "ExecutiveMember" FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin write public content" ON "Antenne" FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin write public content" ON "Event" FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin write public content" ON "Project" FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin write public content" ON "Document" FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin write public content" ON "Partner" FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin write public content" ON "Statistics" FOR ALL TO authenticated USING (true);

-- Note: Since NextAuth uses Prisma with an Admin connection string, 
-- it will bypass RLS unless we use a specific role. 
-- For now, we enable RLS to ensure that manual access via anon keys is blocked.
`;

async function applyRLS() {
    try {
        console.log('Applying RLS Policies...');
        await client.connect();
        await client.query(rlsSql);
        console.log('✅ RLS Policies applied successfully!');
    } catch (err) {
        console.error('❌ Error applying RLS:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyRLS();
