import { GET as getEvents, POST as postEvent } from "@/app/api/events/route"
import { GET as getEventById, PUT as putEvent, DELETE as deleteEvent, PATCH as patchEvent } from "@/app/api/events/[id]/route"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth/requireRole"
import { getServerSession } from "next-auth"
import { NextRequest } from "next/server"
import { Role, EventStatus, EventCategory } from "@prisma/client"

jest.mock("@/lib/prisma", () => ({
  prisma: {
    event: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    }
  }
}))

jest.mock("@/lib/auth/requireRole", () => ({
  requireRole: jest.fn()
}))

jest.mock("next-auth", () => ({
  getServerSession: jest.fn()
}))

// Mock out the auth options to avoid loading prisma-adapter and causing import errors in test runner
jest.mock("@/lib/auth", () => ({
  authOptions: {}
}))

jest.mock("@/lib/auth/auth-options", () => ({
  authOptions: {}
}))

describe("Events Route Handler Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET /api/events", () => {
    it("should fetch published events with default pagination", async () => {
      const mockEvents = [
        {
          id: "event-1",
          title: "Event 1",
          description: "Desc 1",
          location: "Rabat",
          startDate: new Date(),
          category: EventCategory.INTEGRATION,
          status: EventStatus.PUBLISHED,
        }
      ]

      ;(prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents)
      ;(prisma.event.count as jest.Mock).mockResolvedValue(1)

      const req = new NextRequest("http://localhost/api/events")
      const res = await getEvents(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.events).toHaveLength(1)
      expect(data.events[0].title).toBe("Event 1")
      expect(data.pagination).toEqual({
        total: 1,
        pages: 1,
        page: 1,
        limit: 10
      })
      expect(prisma.event.findMany).toHaveBeenCalledWith({
        where: { status: "PUBLISHED" },
        skip: 0,
        take: 10,
        orderBy: { startDate: "desc" },
        include: { _count: { select: { registrations: true } } }
      })
    })

    it("should handle error in GET list", async () => {
      ;(prisma.event.findMany as jest.Mock).mockRejectedValue(new Error("DB error"))

      const req = new NextRequest("http://localhost/api/events")
      const res = await getEvents(req)
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.error).toBe("DB error")
    })
  })

  describe("POST /api/events", () => {
    it("should return 401 when requireRole fails", async () => {
      ;(requireRole as jest.Mock).mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 }),
        session: null
      })

      const req = new NextRequest("http://localhost/api/events", {
        method: "POST",
        body: JSON.stringify({})
      })

      const res = await postEvent(req)
      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.error).toBe("Non authentifié")
    })

    it("should create event successfully for authorized Admin", async () => {
      ;(requireRole as jest.Mock).mockResolvedValue({
        authorized: true,
        user: { id: "admin-id", role: Role.ADMIN },
        session: {}
      })

      const newEventData = {
        title: "Super Integration Day",
        description: "An integration day for students",
        location: "Rabat",
        startDate: "2026-09-15T10:00:00.000Z",
        category: EventCategory.INTEGRATION,
        status: EventStatus.PUBLISHED,
        slug: "super-integration-day"
      }

      const mockCreatedEvent = {
        id: "created-event-1",
        ...newEventData,
        createdById: "admin-id"
      }

      ;(prisma.event.create as jest.Mock).mockResolvedValue(mockCreatedEvent)

      const req = new NextRequest("http://localhost/api/events", {
        method: "POST",
        body: JSON.stringify(newEventData)
      })

      const res = await postEvent(req)
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(data.id).toBe("created-event-1")
      expect(prisma.event.create).toHaveBeenCalled()
    })

    it("should return 400 for validation errors", async () => {
      ;(requireRole as jest.Mock).mockResolvedValue({
        authorized: true,
        user: { id: "admin-id", role: Role.ADMIN },
        session: {}
      })

      const invalidEventData = {
        title: "Short", // Valid minimum title length is 5 in schema
        description: "Short", // Valid minimum is 5 or 10 depending on schema
      }

      const req = new NextRequest("http://localhost/api/events", {
        method: "POST",
        body: JSON.stringify(invalidEventData)
      })

      const res = await postEvent(req)
      expect(res.status).toBe(400)
    })
  })

  describe("GET /api/events/[id]", () => {
    it("should fetch a published event by id", async () => {
      const mockEvent = {
        id: "event-123",
        title: "Test Event",
        description: "Test Description",
        startDate: new Date(),
        status: EventStatus.PUBLISHED,
      }

      ;(prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent)
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const req = new Request("http://localhost/api/events/event-123")
      const params = Promise.resolve({ id: "event-123" })

      const res = await getEventById(req, { params })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe("event-123")
    })

    it("should return 404 if event is not found", async () => {
      ;(prisma.event.findUnique as jest.Mock).mockResolvedValue(null)

      const req = new Request("http://localhost/api/events/missing")
      const params = Promise.resolve({ id: "missing" })

      const res = await getEventById(req, { params })
      expect(res.status).toBe(404)
    })
  })

  describe("PUT /api/events/[id]", () => {
    it("should update event successfully for authorized Admin", async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: "admin-id", role: Role.ADMIN }
      })

      const updateData = {
        title: "New Updated Title",
        description: "New Updated Description",
        category: EventCategory.SOCIAL,
      }

      const mockUpdatedEvent = {
        id: "event-123",
        ...updateData,
        status: EventStatus.PUBLISHED,
      }

      ;(prisma.event.update as jest.Mock).mockResolvedValue(mockUpdatedEvent)

      const req = new Request("http://localhost/api/events/event-123", {
        method: "PUT",
        body: JSON.stringify(updateData)
      })
      const params = Promise.resolve({ id: "event-123" })

      const res = await putEvent(req, { params })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe("New Updated Title")
    })

    it("should reject update if user is not authorized", async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const req = new Request("http://localhost/api/events/event-123", {
        method: "PUT",
        body: JSON.stringify({ title: "No Perms" })
      })
      const params = Promise.resolve({ id: "event-123" })

      const res = await putEvent(req, { params })
      expect(res.status).toBe(401)
    })
  })

  describe("DELETE /api/events/[id]", () => {
    it("should delete event successfully for Admin", async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: "admin-id", role: Role.ADMIN }
      })

      ;(prisma.event.delete as jest.Mock).mockResolvedValue({})

      const req = new Request("http://localhost/api/events/event-123", {
        method: "DELETE"
      })
      const params = Promise.resolve({ id: "event-123" })

      const res = await deleteEvent(req, { params })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain("supprimé")
    })
  })

  describe("PATCH /api/events/[id]", () => {
    it("should publish/suspend event successfully for Admin", async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: "admin-id", role: Role.ADMIN }
      })

      const mockPatchedEvent = {
        id: "event-123",
        title: "Test Event",
        publishedAt: new Date()
      }

      ;(prisma.event.update as jest.Mock).mockResolvedValue(mockPatchedEvent)

      const req = new Request("http://localhost/api/events/event-123", {
        method: "PATCH",
        body: JSON.stringify({ published: true })
      })
      const params = Promise.resolve({ id: "event-123" })

      const res = await patchEvent(req, { params })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe("Événement publié")
    })
  })
})
