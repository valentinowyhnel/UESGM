import { NextResponse } from "next/server"

// Stockage simple en mémoire pour contourner le problème Turbopack
const messages: Array<{
  id: string
  name: string
  email: string
  subject: string
  message: string
  isRead: boolean
  createdAt: string
  updatedAt: string
}> = []

// Rate limiting très simple
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export async function POST(req: Request) {
  try {
    console.log("📨 POST /api/contact - Début traitement")
    
    // Rate limiting basique
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const key = `contact:${ip}`
    const now = Date.now()
    const record = rateLimitStore.get(key)
    
    if (record && now < record.resetTime && record.count >= 5) {
      return NextResponse.json({ 
        error: "Trop de requêtes. Attendez 15 minutes." 
      }, { status: 429 })
    }
    
    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + 900000 })
    } else {
      record.count++
    }
    
    // Lecture du body
    const text = await req.text()
    console.log("📋 Body brut reçu:", text)
    
    let data
    try {
      data = JSON.parse(text)
    } catch {
      return NextResponse.json({ 
        error: "JSON invalide" 
      }, { status: 400 })
    }
    
    // Validation basique
    const { name, email, subject, message } = data
    
    if (!name || typeof name !== 'string' || name.length < 2 || name.length > 100) {
      return NextResponse.json({ 
        error: "Nom invalide (2-100 caractères requis)" 
      }, { status: 400 })
    }
    
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ 
        error: "Email invalide" 
      }, { status: 400 })
    }
    
    if (!message || typeof message !== 'string' || message.length < 10 || message.length > 2000) {
      return NextResponse.json({ 
        error: "Message invalide (10-2000 caractères requis)" 
      }, { status: 400 })
    }
    
    // Création du message
    const contact = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: (subject || '').trim().substring(0, 200),
      message: message.trim().substring(0, 2000),
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Stockage
    messages.push(contact)
    
    console.log("✅ Message créé:", { id: contact.id, name: contact.name, email: contact.email })
    console.log(`📊 Total messages: ${messages.length}`)
    
    return NextResponse.json({ 
      success: true, 
      id: contact.id,
      message: "Message reçu avec succès",
      timestamp: contact.createdAt,
      totalMessages: messages.length
    }, { status: 201 })
    
  } catch (error: any) {
    console.error("❌ Erreur API contact:", error)
    return NextResponse.json({ 
      error: "Erreur serveur",
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    error: "Méthode non autorisée. Utilisez POST." 
  }, { status: 405 })
}

export async function PATCH() {
  return NextResponse.json({ 
    messages: messages,
    total: messages.length,
    note: "Messages stockés en mémoire temporairement"
  })
}
