/**
 * Configuration Jest pour les tests UESGM
 */

// Mock NextAuth pour les tests
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(() => Promise.resolve({
    user: {
      id: 'test-admin-id',
      email: 'admin@test.com',
      role: 'SUPER_ADMIN'
    }
  }))
}))

// Mock Prisma pour les tests
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    event: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn()
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    project: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    document: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    $queryRaw: jest.fn(),
    $disconnect: jest.fn()
  }))
}))

// Mock revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn()
}))

// Configuration globale des tests
beforeAll(async () => {
  // Augmenter le timeout pour les tests async
  jest.setTimeout(30000)
})

afterAll(async () => {
  // Nettoyage après tous les tests
  jest.clearAllMocks()
})

// Silence console.log pendant les tests (optionnel)
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}
