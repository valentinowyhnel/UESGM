import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Client Supabase direct (sans Prisma)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    console.log("📨 POST /api/contact - Version Supabase direct")
    
    const body = await req.json()
    const { name, email, subject, message } = body
    
    // Validation basique
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Données incomplètes' },
        { status: 400 }
      )
    }
    
    // Insertion directe dans Supabase
    const { data, error } = await supabase
      .from('contact_messages')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        subject: subject?.trim() || '',
        message: message.trim(),
        ip: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
        processed: false,
      })
      .select()
    
    if (error) {
      console.error('❌ Erreur Supabase:', error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'insertion', details: error.message },
        { status: 500 }
      )
    }
    
    console.log("✅ Message inséré dans Supabase:", data)
    
    return NextResponse.json({
      success: true,
      data: data,
      message: "Message enregistré avec succès dans Supabase !",
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ Erreur API contact Supabase:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    console.log("📋 GET /api/contact - Version Supabase direct")
    
    // Récupérer tous les messages
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Erreur récupération messages:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération', details: error.message },
        { status: 500 }
      )
    }
    
    console.log("✅ Messages récupérés:", data?.length || 0)
    
    return NextResponse.json({
      success: true,
      data: data,
      total: data?.length || 0,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ Erreur GET contact Supabase:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}
