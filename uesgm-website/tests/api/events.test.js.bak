/**
 * Tests API pour les événements UESGM
 * Couvre: CRUD, publication programmée, validation, sécurité
 */

const request = require('supertest')
const { PrismaClient } = require('@prisma/client')

const app = require('../../app')
const prisma = new PrismaClient()

describe('Events API', () => {
  let adminSession = null
  let testEvent = null
  let scheduledEvent = null

  beforeAll(async () => {
    // Nettoyer la base de données de test
    await prisma.event.deleteMany({
      where: {
        title: {
          contains: 'TEST_'
        }
      }
    })

    // Créer une session admin pour les tests
    // Note: En pratique, vous devriez mocker NextAuth
    adminSession = {
      user: {
        id: 'test-admin-id',
        email: 'admin@test.com',
        role: 'SUPER_ADMIN'
      }
    }
  })

  afterAll(async () => {
    // Nettoyage final
    await prisma.event.deleteMany({
      where: {
        title: {
          contains: 'TEST_'
        }
      }
    })
    await prisma.$disconnect()
  })

  describe('POST /api/admin/events', () => {
    it('devrait créer un événement avec publication immédiate', async () => {
      const payload = {
        title: 'TEST_Event_Now',
        description: 'Description de test pour publication immédiate',
        location: 'Test Location',
        category: 'CULTURAL',
        startDate: '2026-06-01T10:00:00Z',
        endDate: '2026-06-01T12:00:00Z',
        publishMode: 'NOW',
        antenneIds: []
      }

      const response = await request(app)
        .post('/api/admin/events')
        .send(payload)
        .expect(201)

      testEvent = response.body.event

      expect(response.body.success).toBe(true)
      expect(testEvent.title).toBe(payload.title)
      expect(testEvent.status).toBe('PUBLISHED')
      expect(testEvent.publishedAt).toBeTruthy()
    })

    it('devrait créer un événement avec publication programmée', async () => {
      const payload = {
        title: 'TEST_Event_Scheduled',
        description: 'Description de test pour publication programmée',
        location: 'Scheduled Location',
        category: 'ACADEMIC',
        startDate: '2026-07-01T14:00:00Z',
        endDate: '2026-07-01T16:00:00Z',
        publishMode: 'SCHEDULED',
        publishedAt: '2026-05-01T08:00:00Z',
        antenneIds: []
      }

      const response = await request(app)
        .post('/api/admin/events')
        .send(payload)
        .expect(201)

      scheduledEvent = response.body.event

      expect(response.body.success).toBe(true)
      expect(scheduledEvent.title).toBe(payload.title)
      expect(scheduledEvent.status).toBe('SCHEDULED')
      expect(scheduledEvent.publishedAt).toBe(payload.publishedAt)
    })

    it('devrait rejeter un titre trop court', async () => {
      const payload = {
        title: 'TE', // Moins de 3 caractères
        description: 'Description valide',
        location: 'Test Location',
        category: 'CULTURAL',
        startDate: '2026-06-01T10:00:00Z',
        publishMode: 'NOW',
        antenneIds: []
      }

      const response = await request(app)
        .post('/api/admin/events')
        .send(payload)
        .expect(400)

      expect(response.body.error).toBe('Données invalides')
      expect(response.body.details).toHaveLength(1)
      expect(response.body.details[0].field).toBe('title')
    })

    it('devrait rejeter une description trop courte', async () => {
      const payload = {
        title: 'TEST_Event_Valid',
        description: 'Desc', // Moins de 10 caractères
        location: 'Test Location',
        category: 'CULTURAL',
        startDate: '2026-06-01T10:00:00Z',
        publishMode: 'NOW',
        antenneIds: []
      }

      const response = await request(app)
        .post('/api/admin/events')
        .send(payload)
        .expect(400)

      expect(response.body.error).toBe('Données invalides')
      expect(response.body.details[0].field).toBe('description')
    })

    it('devrait rejeter une catégorie invalide', async () => {
      const payload = {
        title: 'TEST_Event_Invalid',
        description: 'Description valide pour test',
        location: 'Test Location',
        category: 'INVALID_CATEGORY',
        startDate: '2026-06-01T10:00:00Z',
        publishMode: 'NOW',
        antenneIds: []
      }

      const response = await request(app)
        .post('/api/admin/events')
        .send(payload)
        .expect(400)

      expect(response.body.error).toBe('Données invalides')
    })

    it('devrait rejeter des dates invalides', async () => {
      const payload = {
        title: 'TEST_Event_Invalid_Date',
        description: 'Description valide',
        location: 'Test Location',
        category: 'CULTURAL',
        startDate: 'invalid-date',
        publishMode: 'NOW',
        antenneIds: []
      }

      const response = await request(app)
        .post('/api/admin/events')
        .send(payload)
        .expect(400)

      expect(response.body.error).toBeTruthy()
    })
  })

  describe('GET /api/admin/events', () => {
    it('devrait retourner la liste des événements avec pagination', async () => {
      const response = await request(app)
        .get('/api/admin/events')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.pagination).toBeTruthy()
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(0)
      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(10)
    })

    it('devrait filtrer par statut', async () => {
      const response = await request(app)
        .get('/api/admin/events?status=PUBLISHED')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.every(event => event.status === 'PUBLISHED')).toBe(true)
    })

    it('devrait filtrer par catégorie', async () => {
      const response = await request(app)
        .get('/api/admin/events?category=CULTURAL')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.every(event => event.category === 'CULTURAL')).toBe(true)
    })

    it('devrait rechercher par texte', async () => {
      const response = await request(app)
        .get('/api/admin/events?search=TEST_Event')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.length).toBeGreaterThanOrEqual(2) // Nos événements de test
    })
  })

  describe('GET /api/events/public', () => {
    it('devrait retourner uniquement les événements publiés', async () => {
      const response = await request(app)
        .get('/api/events/public')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      
      // Vérifier que seul l'événement publié est présent
      const publishedEvents = response.body.data.filter(e => e.status === 'PUBLISHED')
      const scheduledEvents = response.body.data.filter(e => e.status === 'SCHEDULED')
      
      expect(publishedEvents.length).toBeGreaterThanOrEqual(1)
      expect(scheduledEvents.length).toBe(0)
    })

    it('devrait inclure les headers de cache', async () => {
      const response = await request(app)
        .get('/api/events/public')
        .expect(200)

      expect(response.headers['cache-control']).toContain('public')
      expect(response.headers['cache-control']).toContain('s-maxage')
    })
  })

  describe('PUT /api/admin/events', () => {
    it('devrait mettre à jour un événement', async () => {
      const updatePayload = {
        title: 'TEST_Event_Updated',
        description: 'Description mise à jour'
      }

      const response = await request(app)
        .put(`/api/admin/events?id=${testEvent.id}`)
        .send(updatePayload)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.event.title).toBe(updatePayload.title)
      expect(response.body.event.description).toBe(updatePayload.description)
    })

    it('devrait rejeter la mise à jour d\'un événement inexistant', async () => {
      const updatePayload = {
        title: 'TEST_Event_Updated',
        description: 'Description mise à jour'
      }

      const response = await request(app)
        .put('/api/admin/events?id=non-existent-id')
        .send(updatePayload)
        .expect(404)

      expect(response.body.error).toBeTruthy()
    })
  })

  describe('POST /api/admin/events/publish-scheduled', () => {
    it('devrait publier les événements programmés', async () => {
      // Simuler que l'heure de publication est passée
      await prisma.event.update({
        where: { id: scheduledEvent.id },
        data: {
          publishedAt: new Date(Date.now() - 1000) // 1 seconde dans le passé
        }
      })

      const response = await request(app)
        .post('/api/admin/events/publish-scheduled')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.published.length).toBeGreaterThanOrEqual(1)
      
      // Vérifier que l'événement est maintenant publié
      const publishedEvent = response.body.published.find(e => e.id === scheduledEvent.id)
      expect(publishedEvent).toBeTruthy()
    })

    it('devrait retourner un message si aucun événement à publier', async () => {
      // S'assurer qu'aucun événement n'est à publier
      await prisma.event.updateMany({
        where: { status: 'SCHEDULED' },
        data: { publishedAt: new Date(Date.now() + 86400000) } // Demain
      })

      const response = await request(app)
        .post('/api/admin/events/publish-scheduled')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Aucun événement')
      expect(response.body.published).toHaveLength(0)
    })
  })

  describe('DELETE /api/admin/events', () => {
    it('devrait supprimer un événement', async () => {
      const response = await request(app)
        .delete(`/api/admin/events?id=${testEvent.id}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('supprimé')

      // Vérifier que l'événement n'existe plus
      const deletedEvent = await prisma.event.findUnique({
        where: { id: testEvent.id }
      })
      expect(deletedEvent).toBeNull()
    })

    it('devrait rejeter la suppression d\'un événement inexistant', async () => {
      const response = await request(app)
        .delete('/api/admin/events?id=non-existent-id')
        .expect(404)

      expect(response.body.error).toBeTruthy()
    })
  })

  describe('Sécurité', () => {
    it('devrait rejeter les requêtes non authentifiées', async () => {
      const payload = {
        title: 'TEST_Unauthorized',
        description: 'Description test',
        location: 'Test',
        category: 'CULTURAL',
        startDate: '2026-06-01T10:00:00Z',
        publishMode: 'NOW',
        antenneIds: []
      }

      // Mock sans session
      const response = await request(app)
        .post('/api/admin/events')
        .send(payload)
        .expect(401)

      expect(response.body.error).toContain('Non authentifié')
    })

    it('devrait protéger contre l\'injection SQL basique', async () => {
      const maliciousPayload = {
        title: "'; DROP TABLE Event; --",
        description: 'Description test',
        location: 'Test',
        category: 'CULTURAL',
        startDate: '2026-06-01T10:00:00Z',
        publishMode: 'NOW',
        antenneIds: []
      }

      const response = await request(app)
        .post('/api/admin/events')
        .send(maliciousPayload)
        .expect(400)

      expect(response.body.error).toBeTruthy()
    })
  })
})
