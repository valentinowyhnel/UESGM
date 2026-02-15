import { Client } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

async function checkDatabase() {
    const dbName = 'uesgm_website'
    // Connection string to 'postgres' default database to check existence of the target DB
    const rootUrl = process.env.DATABASE_URL?.replace(dbName, 'postgres')

    if (!rootUrl) {
        console.error("❌ DATABASE_URL missing in .env")
        return
    }

    const client = new Client({ connectionString: rootUrl })

    try {
        console.log(`🔍 Connexion au serveur PostgreSQL...`)
        await client.connect()
        console.log("✅ Connecté au serveur.")

        const res = await client.query("SELECT datname FROM pg_database WHERE datname = $1", [dbName])

        if (res.rows.length > 0) {
            console.log(`✅ Base de données '${dbName}' EXISTE déjà.`)
        } else {
            console.log(`❌ Base de données '${dbName}' n'existe pas. Tentative de création...`)
            try {
                await client.query(`CREATE DATABASE ${dbName}`)
                console.log(`✅ Base de données '${dbName}' CRÉÉE avec succès.`)
            } catch (createErr) {
                console.error(`❌ Échec de la création de la base de données:`, createErr)
            }
        }
    } catch (err) {
        console.error("❌ Impossible de joindre le serveur PostgreSQL. Vérifiez vos identifiants ou si le service est lancé.", err)
        console.log("\nDÉTAILS DE CONNEXION TESTÉS :")
        console.log(`Host: 127.0.0.1`)
        console.log(`User: postgres`)
    } finally {
        await client.end()
    }
}

checkDatabase()
