import { NextResponse } from 'next/server'

// Test simple sans Prisma pour vérifier le serveur
export async function GET(req: Request) {
  try {
    console.log("🔍 Test simple du serveur...")
    
    // Test sans dépendances externes
    const testData = {
      success: true,
      message: "✅ Serveur Next.js fonctionne !",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: {
        url: process.env.DATABASE_URL ? 'Configuré' : 'Non configuré',
        supabase: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configuré' : 'Non configuré',
      }
    }
    
    console.log("✅ Test serveur réussi:", testData)
    
    return NextResponse.json(testData)
    
  } catch (error: any) {
    console.error("❌ Erreur test serveur:", error)
    return NextResponse.json({
      success: false,
      error: "❌ Erreur serveur",
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
