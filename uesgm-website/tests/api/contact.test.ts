import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/contact/route';
import prisma from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  contactMessage: {
    create: jest.fn().mockResolvedValue({ id: 'test-id' }),
  },
}));

// Mock Rate Limiter
jest.mock('@/lib/rate-limit', () => ({
  ContactRateLimiter: {
    checkContact: jest.fn().mockResolvedValue({
      allowed: true,
      headers: {},
    }),
  },
}));

describe('/api/contact API Endpoint', () => {
  it('should create a contact message successfully with valid data', async () => {
    const body = {
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Hello',
      message: 'This is a test message that is long enough.',
    };

    const request = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.id).toBe('test-id');
    expect(prisma.contactMessage.create).toHaveBeenCalled();
  });

  it('should return 400 for invalid email', async () => {
    const body = {
      name: 'Test User',
      email: 'invalid-email',
      message: 'Message too short',
    };

    const request = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
