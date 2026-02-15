import { PrismaClient } from '@prisma/client'

async function main() {
    const prisma = new PrismaClient({
        datasourceUrl: process.env.DATABASE_URL
    })
    try {
        console.log('Testing connection to Supabase...')
        console.log('URL used (masked):', process.env.DATABASE_URL?.replace(/:.*@/, ':****@'))
        await prisma.$connect()
        console.log('✅ Connection successful!')
    } catch (e) {
        console.error('❌ Connection failed!')
        console.error(e)
        // Check if DB extension is present
        // Prisma error P1001 often means DNS or host issue
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
