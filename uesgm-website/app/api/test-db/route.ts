import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Test de connexion direct à Supabase
export async function GET(req: Request) {
  try {
    console.log("🔍 Test de connexion à Supabase...")
    
    // Test 1: Connexion simple
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log("✅ Connexion réussie:", result)
    
    // Test 2: Compter les utilisateurs
    const userCount = await prisma.user.count()
    console.log("👥 Utilisateurs:", userCount)
    
    // Test 3: Compter les messages de contact
    const contactCount = await prisma.contactMessage.count()
    console.log("📧 Messages de contact:", contactCount)
    
    // Test 4: Compter les événements
    const eventCount = await prisma.event.count()
    console.log("📅 Événements:", eventCount)
    
    // Test 5: Compter les documents
    const documentCount = await prisma.document.count()
    console.log("📄 Documents:", documentCount)
    
    // Test 6: Compter les partenaires
    const partnerCount = await prisma.partner.count()
    console.log("🤝 Partenaires:", partnerCount)
    
    // Test 7: Compter les antennes
    const antenneCount = await prisma.antenne.count()
    console.log("📍 Antennes:", antenneCount)
    
    // Test 8: Compter les projets
    const projectCount = await prisma.project.count()
    console.log("🚀 Projets:", projectCount)
    
    // Test 9: Compter les membres du bureau
    const memberCount = await prisma.executiveMember.count()
    console.log("👔 Membres bureau:", memberCount)
    
    // Test 10: Compter les abonnés newsletter
    const newsletterCount = await prisma.newsletter.count()
    console.log("📰 Newsletter:", newsletterCount)
    
    return NextResponse.json({
      success: true,
      message: "✅ Connexion à Supabase réussie !",
      database: {
        users: userCount,
        contactMessages: contactCount,
        events: eventCount,
        documents: documentCount,
        partners: partnerCount,
        antennes: antenneCount,
        projects: projectCount,
        executiveMembers: memberCount,
        newsletter: newsletterCount,
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error("❌ Erreur de connexion à Supabase:", error)
    return NextResponse.json({
      success: false,
      error: "❌ Erreur de connexion à Supabase",
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
