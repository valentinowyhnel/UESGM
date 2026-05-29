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

describe('Contact API', () => {
  it('should return 400 for invalid data', async () => {
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name: 'J' }), // Name too short
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('should create a contact message for valid data', async () => {
    ;(prisma.contactMessage.create as jest.Mock).mockResolvedValue({ id: '123' })

    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message from Jest.',
      }),
    })

    const response = await POST(req)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.success).toBe(true)
    expect(prisma.contactMessage.create).toHaveBeenCalled()
  })
})
