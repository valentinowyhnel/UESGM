const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function changePassword() {
    const email = "president@uesgm.ma";
    const newPassword = "UESGM_Secure_Vault_2026!"; // New strong password

    try {
        console.log(`Hashing password for ${email}...`);
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await client.connect();
        const res = await client.query(
            'UPDATE "User" SET password = $1 WHERE email = $2 RETURNING id',
            [hashedPassword, email]
        );

        if (res.rowCount > 0) {
            console.log('✅ Admin password updated successfully!');
            console.log('🔑 New Password:', newPassword);
        } else {
            console.log('❌ Admin user not found. Did you run the seed script?');
        }
    } catch (err) {
        console.error('❌ Error updating password:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

changePassword();
