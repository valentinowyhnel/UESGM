const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Missing Supabase URL or Service Role Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createBuckets() {
    const buckets = ['images', 'documents'];

    for (const bucketName of buckets) {
        console.log(`Checking bucket: ${bucketName}...`);
        const { data: bucket, error: checkError } = await supabase.storage.getBucket(bucketName);

        if (checkError && checkError.message.includes('not found')) {
            console.log(`Creating bucket: ${bucketName}...`);
            const { error: createError } = await supabase.storage.createBucket(bucketName, {
                public: true, // Images and public docs can be public
                allowedMimeTypes: bucketName === 'images' ? ['image/*'] : undefined,
                fileSizeLimit: bucketName === 'images' ? 5242880 : 20971520 // Matches .env limits
            });

            if (createError) {
                console.error(`❌ Error creating bucket ${bucketName}:`, createError.message);
            } else {
                console.log(`✅ Bucket ${bucketName} created!`);
            }
        } else if (checkError) {
            console.error(`❌ Error checking bucket ${bucketName}:`, checkError.message);
        } else {
            console.log(`ℹ️ Bucket ${bucketName} already exists.`);
        }
    }
}

createBuckets();
