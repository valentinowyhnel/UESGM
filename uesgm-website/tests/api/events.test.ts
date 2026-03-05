import { createMocks } from 'node-mocks-http';
import { GET as getEvents } from '@/app/api/events/route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('Events API', () => {
  it('returns a list of published events', async () => {
    (prisma.event.findMany as jest.Mock).mockResolvedValue([
      { id: '1', title: 'Test Event', status: 'PUBLISHED' },
    ]);
    (prisma.event.count as jest.Mock).mockResolvedValue(1);

    const { req } = createMocks({
      method: 'GET',
      url: '/api/events?status=upcoming',
    });

    const response = await getEvents(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].title).toBe('Test Event');
  });
});
