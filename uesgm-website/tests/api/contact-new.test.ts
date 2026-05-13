import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/contact/route';
import { prisma } from '@/lib/prisma';

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    contactMessage: {
      create: jest.fn().mockResolvedValue({ id: 'msg_123' }),
    },
  },
}));

// Mock rate-limit
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue(true),
}));

describe('/api/contact API Endpoint', () => {
  it('should return 201 when valid data is provided', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      json: async () => ({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test message that is long enough.',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.id).toBe('msg_123');
  });

  it('should return 400 when invalid email is provided', async () => {
    const { req } = createMocks({
      method: 'POST',
      json: async () => ({
        name: 'Test User',
        email: 'invalid-email',
        message: 'Valid message content',
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});
