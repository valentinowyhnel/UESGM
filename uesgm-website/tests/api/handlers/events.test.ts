import { GET, POST } from "@/app/api/events/route"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"
import { requireRole } from "@/lib/auth/requireRole"

jest.mock("@/lib/prisma", () => ({
  prisma: {
    event: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn()
    }
  }
}))

jest.mock("@/lib/auth/requireRole", () => ({
  requireRole: jest.fn().mockResolvedValue({
    authorized: true,
    user: { id: "test-admin-id", email: "admin@test.com", role: "SUPER_ADMIN" }
  })
}))

describe("Events API Route Handlers", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET /api/events", () => {
    it("should return public/published events successfully with pagination", async () => {
      const mockEvents = [
        {
          id: "event-1",
          title: "Integration Day",
          description: "Integration event for new students",
          location: "Rabat",
          startDate: "2026-06-01T10:00:00Z",
          category: "INTEGRATION",
          status: "PUBLISHED"
        }
      ]

      ;(prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents)
      ;(prisma.event.count as jest.Mock).mockResolvedValue(1)

      const req = new NextRequest("http://localhost/api/events?page=1&limit=10")
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.events).toEqual(mockEvents)
      expect(data.pagination.total).toBe(1)
      expect(prisma.event.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { status: "PUBLISHED" }
      }))
    })

    it("should allow filtering by category", async () => {
      ;(prisma.event.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.event.count as jest.Mock).mockResolvedValue(0)

      const req = new NextRequest("http://localhost/api/events?category=ACADEMIC")
      const response = await GET(req)

      expect(response.status).toBe(200)
      expect(prisma.event.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          category: "ACADEMIC"
        })
      }))
    })
  })

  describe("POST /api/events", () => {
    it("should create an event successfully for authorized admin", async () => {
      const mockEventData = {
        title: "New E2E Event",
        description: "Valid description for the test event",
        location: "Casablanca",
        startDate: "2026-06-01T10:00:00Z",
        category: "CULTURAL",
        status: "PUBLISHED"
      }

      ;(prisma.event.create as jest.Mock).mockResolvedValue({
        id: "new-event-id",
        slug: "new-e2e-event",
        ...mockEventData
      })

      const req = new NextRequest("http://localhost/api/events", {
        method: "POST",
        body: JSON.stringify(mockEventData)
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe("new-event-id")
      expect(data.slug).toBe("new-e2e-event")
      expect(prisma.event.create).toHaveBeenCalled()
    })

    it("should return 400 for invalid event data", async () => {
      const invalidEventData = {
        title: "Ab", // too short
        description: "Short", // too short
        location: "", // too short
        startDate: "invalid-date"
      }

      const req = new NextRequest("http://localhost/api/events", {
        method: "POST",
        body: JSON.stringify(invalidEventData)
      })

      const response = await POST(req)
      expect(response.status).toBe(400)
    })

    it("should return 403 if unauthorized", async () => {
      ;(requireRole as jest.Mock).mockResolvedValueOnce({
        authorized: false,
        response: new Response(JSON.stringify({ error: "Access denied" }), { status: 403 })
      })

      const mockEventData = {
        title: "Unauthorized Event",
        description: "Valid description for the test event",
        location: "Casablanca",
        startDate: "2026-06-01T10:00:00Z",
        category: "CULTURAL"
      }

      const req = new NextRequest("http://localhost/api/events", {
        method: "POST",
        body: JSON.stringify(mockEventData)
      })

      const response = await POST(req)
      expect(response.status).toBe(403)
    })
  })
})
