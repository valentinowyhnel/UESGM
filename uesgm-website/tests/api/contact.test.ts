import { POST } from '@/app/api/contact/route'
import { prisma } from '@/lib/prisma'
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
    checkContact: jest.fn().mockResolvedValue({ allowed: true, headers: {} }),
  },
}))

// Mock de Request si nécessaire (pour les anciennes versions de Node)
if (typeof Request === 'undefined') {
  const { Request } = require('next/dist/compiled/@edge-runtime/primitives')
  global.Request = Request
}

describe('Contact API', () => {
  it('should create a contact message with valid data', async () => {
    const mockData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello, this is a test message',
    }

    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify(mockData),
      headers: {
        'x-forwarded-for': '127.0.0.1',
      },
    })

    ;(prisma.contactMessage.create as jest.Mock).mockResolvedValue({ id: '123', ...mockData })

    const response = await POST(req)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.success).toBe(true)
    expect(prisma.contactMessage.create).toHaveBeenCalled()
  })

  it('should return 400 for invalid data', async () => {
    const mockData = {
      name: 'J',
      email: 'invalid-email',
      message: 'short',
    }

    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify(mockData),
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
  })
})
