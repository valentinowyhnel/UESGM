/**
 * Utilitaires pour les tests UESGM
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * Nettoie les données de test de la base de données
 */
async function cleanupTestData() {
  console.log('🧹 Nettoyage des données de test...')
  
  try {
    // Supprimer les événements de test
    await prisma.event.deleteMany({
      where: {
        title: {
          contains: 'TEST_'
        }
      }
    })

    // Supprimer les projets de test
    await prisma.project.deleteMany({
      where: {
        title: {
          contains: 'TEST_'
        }
      }
    })

    // Supprimer les documents de test
    await prisma.document.deleteMany({
      where: {
        title: {
          contains: 'TEST_'
        }
      }
    })

    console.log('✅ Nettoyage terminé')
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
    throw error
  }
}

/**
 * Crée un utilisateur de test admin
 */
async function createTestAdmin() {
  try {
    const admin = await prisma.user.findFirst({
      where: {
        email: 'admin@test.com'
      }
    })

    if (!admin) {
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('TestAdmin123!', 10)

      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@test.com',
          password: hashedPassword,
          name: 'Admin Test',
          role: 'SUPER_ADMIN'
        }
      })

      console.log('✅ Admin de test créé:', newAdmin.email)
      return newAdmin
    }

    return admin
  } catch (error) {
    console.error('❌ Erreur création admin:', error)
    throw error
  }
}

/**
 * Crée des événements de test
 */
async function createTestEvents() {
  try {
    const admin = await createTestAdmin()

    const events = [
      {
        title: 'TEST_Event_Published',
        slug: 'test-event-published',
        description: 'Description d\'un événement publié pour test',
        location: 'Test Location',
        category: 'CULTURAL',
        status: 'PUBLISHED',
        startDate: new Date('2026-06-01T10:00:00Z'),
        endDate: new Date('2026-06-01T12:00:00Z'),
        publishedAt: new Date(),
        createdById: admin.id
      },
      {
        title: 'TEST_Event_Scheduled',
        slug: 'test-event-scheduled',
        description: 'Description d\'un événement programmé pour test',
        location: 'Scheduled Location',
        category: 'ACADEMIC',
        status: 'SCHEDULED',
        startDate: new Date('2026-07-01T14:00:00Z'),
        endDate: new Date('2026-07-01T16:00:00Z'),
        publishedAt: new Date('2026-05-01T08:00:00Z'),
        createdById: admin.id
      },
      {
        title: 'TEST_Event_Draft',
        slug: 'test-event-draft',
        description: 'Description d\'un brouillon pour test',
        location: 'Draft Location',
        category: 'SOCIAL',
        status: 'DRAFT',
        startDate: new Date('2026-08-01T09:00:00Z'),
        endDate: new Date('2026-08-01T11:00:00Z'),
        createdById: admin.id
      }
    ]

    const createdEvents = await Promise.all(
      events.map(event => 
        prisma.event.upsert({
          where: { slug: event.slug },
          update: event,
          create: event
        })
      )
    )

    console.log(`✅ ${createdEvents.length} événements de test créés`)
    return createdEvents
  } catch (error) {
    console.error('❌ Erreur création événements:', error)
    throw error
  }
}

/**
 * Vérifie que le serveur est accessible
 */
async function checkServerHealth(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/api/health`)
    const health = await response.json()
    
    if (health.status === 'ok' && health.database.status === 'connected') {
      console.log('✅ Serveur accessible et base de données connectée')
      return true
    } else {
      console.log('⚠️ Serveur accessible mais problèmes détectés:', health)
      return false
    }
  } catch (error) {
    console.log('❌ Serveur inaccessible:', error.message)
    return false
  }
}

/**
 * Génère un token CSRF pour les tests
 */
async function getCsrfToken(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/api/auth/csrf`)
    const data = await response.json()
    return data.csrfToken
  } catch (error) {
    console.error('❌ Erreur récupération CSRF:', error)
    throw error
  }
}

/**
 * Effectue une connexion admin et retourne les cookies
 */
async function adminLogin(baseUrl, email = 'president@uesgm.ma', password = 'UESGM_President_2025_Secret!') {
  try {
    const csrfToken = await getCsrfToken(baseUrl)
    
    const formData = new URLSearchParams()
    formData.append('email', email)
    formData.append('password', password)
    formData.append('csrfToken', csrfToken)

    const response = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    })

    if (response.ok) {
      // Extraire les cookies de la réponse
      const cookies = response.headers.get('set-cookie')
      return cookies
    } else {
      throw new Error(`Login failed: ${response.status}`)
    }
  } catch (error) {
    console.error('❌ Erreur connexion:', error)
    throw error
  }
}

/**
 * Attend que la base de données soit prête
 */
async function waitForDatabase(timeout = 30000) {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('✅ Base de données prête')
      return true
    } catch (error) {
      console.log('⏳ Attente de la base de données...')
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  throw new Error('Base de données non disponible après le timeout')
}

module.exports = {
  prisma,
  cleanupTestData,
  createTestAdmin,
  createTestEvents,
  checkServerHealth,
  getCsrfToken,
  adminLogin,
  waitForDatabase
}
