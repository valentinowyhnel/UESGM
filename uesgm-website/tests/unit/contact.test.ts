import { POST } from '@/app/api/contact/route'
import { prisma } from '@/lib/prisma'
import { ContactRateLimiter } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'

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

describe('Contact API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a contact message successfully', async () => {
    const mockData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello, this is a test message from Jules.',
    }

    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(mockData),
    })

    ;(ContactRateLimiter.checkContact as jest.Mock).mockResolvedValue({
      allowed: true,
      headers: {},
    })

    ;(prisma.contactMessage.create as jest.Mock).mockResolvedValue({
      id: 'test-id',
      ...mockData,
    })

    const response = await POST(req)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.success).toBe(true)
    expect(prisma.contactMessage.create).toHaveBeenCalled()
  })

  it('should return 429 if rate limited', async () => {
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello',
      }),
    })

    ;(ContactRateLimiter.checkContact as jest.Mock).mockResolvedValue({
      allowed: false,
      message: 'Too many requests',
      headers: { 'Retry-After': '60' },
    })

    const response = await POST(req)
    expect(response.status).toBe(429)
  })
})
