import { POST as contactHandler } from '@/app/api/contact/route';
import { prisma } from '@/lib/prisma';
import { ContactRateLimiter } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    contactMessage: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/rate-limit', () => ({
  ContactRateLimiter: {
    checkContact: jest.fn(),
  },
}));

describe('POST /api/contact', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a contact message successfully', async () => {
    (ContactRateLimiter.checkContact as jest.Mock).mockResolvedValue({
      allowed: true,
      headers: {},
    });

    (prisma.contactMessage.create as jest.Mock).mockResolvedValue({
      id: 'msg_123',
    });

    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'This is a test message with more than 10 characters',
      }),
    });

    const response = await contactHandler(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.id).toBe('msg_123');
  });

  it('should return 400 for invalid data', async () => {
    (ContactRateLimiter.checkContact as jest.Mock).mockResolvedValue({
      allowed: true,
      headers: {},
    });

    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        name: 'J', // too short
        email: 'invalid-email',
        message: 'short',
      }),
    });

    const response = await contactHandler(req);
    expect(response.status).toBe(400);
  });

  it('should return 429 when rate limited', async () => {
    (ContactRateLimiter.checkContact as jest.Mock).mockResolvedValue({
      allowed: false,
      message: 'Too many requests',
      headers: { 'Retry-After': '60' },
    });

    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Valid message content here',
      }),
    });

    const response = await contactHandler(req);
    expect(response.status).toBe(429);
  });
});
