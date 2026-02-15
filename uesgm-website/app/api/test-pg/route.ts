import { NextResponse } from 'next/server'

// Test de connexion Supabase avec pg (PostgreSQL natif)
export async function GET(req: Request) {
  try {
    console.log("🔍 Test connexion Supabase avec pg...")
    
    // Importer pg dynamiquement pour éviter les erreurs Turbopack
    const { Client } = await import('pg')
    
    // Configuration de connexion
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
    
    console.log("📡 Connexion en cours...")
    
    // Test de connexion
    await client.connect()
    console.log("✅ Connexion réussie !")
    
    // Test de requête
    const result = await client.query('SELECT NOW() as current_time, version() as version')
    console.log("📊 Résultat requête:", result.rows[0])
    
    // Test de la table contact_messages
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'contact_messages'
      ) as exists
    `)
    
    console.log("📋 Table contact_messages existe:", tableExists.rows[0].exists)
    
    if (tableExists.rows[0].exists) {
      // Compter les messages
      const countResult = await client.query('SELECT COUNT(*) as count FROM contact_messages')
      console.log("📧 Messages dans la table:", countResult.rows[0].count)
      
      // Récupérer les 5 derniers messages
      const messagesResult = await client.query(`
        SELECT id, name, email, subject, created_at 
        FROM contact_messages 
        ORDER BY created_at DESC 
        LIMIT 5
      `)
      console.log("📋 Derniers messages:", messagesResult.rows.length)
      
      await client.end()
      
      return NextResponse.json({
        success: true,
        message: "✅ Connexion Supabase réussie !",
        database: {
          connected: true,
          currentTime: result.rows[0].current_time,
          version: result.rows[0].version,
          tableExists: tableExists.rows[0].exists,
          messageCount: countResult.rows[0].count,
          recentMessages: messagesResult.rows
        },
        timestamp: new Date().toISOString()
      })
    } else {
      await client.end()
      
      return NextResponse.json({
        success: true,
        message: "✅ Connexion réussie mais table contact_messages n'existe pas",
        database: {
          connected: true,
          currentTime: result.rows[0].current_time,
          version: result.rows[0].version,
          tableExists: false,
          messageCount: 0,
          recentMessages: []
        },
        timestamp: new Date().toISOString()
      })
    }
    
  } catch (error: any) {
    console.error("❌ Erreur connexion Supabase:", error)
    return NextResponse.json({
      success: false,
      error: "❌ Erreur de connexion à Supabase",
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
