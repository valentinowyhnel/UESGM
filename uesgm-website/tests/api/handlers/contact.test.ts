import { POST } from "@/app/api/contact/route"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

jest.mock("@/lib/prisma", () => ({
  prisma: {
    contactMessage: {
      create: jest.fn()
    }
  }
}))

jest.mock("@/lib/rate-limit", () => ({
  rateLimit: jest.fn().mockResolvedValue(true)
}))

describe("POST /api/contact", () => {
  it("should create a contact message successfully", async () => {
    const mockMessage = {
      name: "John Doe",
      email: "john@example.com",
      subject: "Test Subject",
      message: "This is a test message that is long enough."
    }

    ;(prisma.contactMessage.create as jest.Mock).mockResolvedValue({
      id: "test-id",
      ...mockMessage
    })

    const req = new NextRequest("http://localhost/api/contact", {
      method: "POST",
      body: JSON.stringify(mockMessage)
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(prisma.contactMessage.create).toHaveBeenCalled()
  })

  it("should return 400 for invalid data", async () => {
    const invalidMessage = {
      name: "J",
      email: "invalid-email",
      message: "Short"
    }

    const req = new NextRequest("http://localhost/api/contact", {
      method: "POST",
      body: JSON.stringify(invalidMessage)
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it("should return 429 when rate limited", async () => {
    ;(rateLimit as jest.Mock).mockResolvedValue(false)

    const req = new NextRequest("http://localhost/api/contact", {
      method: "POST",
      body: JSON.stringify({
        name: "John Doe",
        email: "john@example.com",
        message: "This is a test message that is long enough."
      })
    })

    const response = await POST(req)
    expect(response.status).toBe(429)
  })
})
