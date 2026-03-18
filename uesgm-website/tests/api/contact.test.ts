import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/contact/route';
import { prisma } from '@/lib/prisma';

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    contactMessage: {
      create: jest.fn(),
    },
  },
}));

describe('/api/contact', () => {
  it('should create a contact message with valid data', async () => {
    const body = {
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Test Subject',
      message: 'This is a test message with enough length.',
    };

    const { req } = createMocks({
      method: 'POST',
      json: () => Promise.resolve(body),
      headers: {
        'content-type': 'application/json',
      },
    });

    // Mock implementation for prisma.create
    (prisma.contactMessage.create as jest.Mock).mockResolvedValue({
      id: 'test-id',
      ...body,
      createdAt: new Date(),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.id).toBe('test-id');
    expect(prisma.contactMessage.create).toHaveBeenCalled();
  });

  it('should return 400 for invalid data', async () => {
    const body = {
      name: 'J', // Too short
      email: 'invalid-email',
      message: 'Short',
    };

    const { req } = createMocks({
      method: 'POST',
      json: () => Promise.resolve(body),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Données invalides');
  });
});
