import { POST } from '@/app/api/contact/route'
import { prisma } from '@/lib/prisma'
import { ContactRateLimiter } from '@/lib/rate-limit'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    contactMessage: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/rate-limit', () => ({
  ContactRateLimiter: {
    checkContact: jest.fn(),
  },
}))

describe('/api/contact', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 for invalid data', async () => {
    ;(ContactRateLimiter.checkContact as jest.Mock).mockResolvedValue({
      allowed: true,
      headers: {},
    })

    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Données invalides')
  })

  it('should return 429 when rate limited', async () => {
    ;(ContactRateLimiter.checkContact as jest.Mock).mockResolvedValue({
      allowed: false,
      message: 'Too many requests',
      headers: { 'Retry-After': '900' },
    })

    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello, this is a test message.',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('900')
  })

  it('should successfully create a contact message', async () => {
    ;(ContactRateLimiter.checkContact as jest.Mock).mockResolvedValue({
      allowed: true,
      headers: {},
    })
    ;(prisma.contactMessage.create as jest.Mock).mockResolvedValue({ id: '123' })

    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello, this is a test message.',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.id).toBe('123')
  })
})
