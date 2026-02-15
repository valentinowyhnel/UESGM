import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma-wrapper";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DocumentCategory, DocumentVisibility } from "@/types/documents";

const createDocSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.nativeEnum(DocumentCategory).optional(),
  visibility: z.nativeEnum(DocumentVisibility).optional(),
  tags: z.array(z.string()).optional(),
  fileUrl: z.string().url(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  fileSize: z.number().int().optional(),
  published: z.boolean().optional().default(false),
});

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// GET - List documents (admin)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const visibility = searchParams.get("visibility") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }
    if (category) where.category = category;
    if (visibility) where.visibility = visibility;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { tags: true },
      }),
      prisma.document.count({ where })
    ]);

    return NextResponse.json({
      data: documents,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("List documents error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Create document (admin)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parse = createDocSchema.safeParse(body);
    
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }

    const { title, description, category = DocumentCategory.ADMINISTRATIF, visibility = DocumentVisibility.PUBLIC, tags = [], fileUrl, fileName, mimeType, fileSize, published = false } = parse.data;

    // Generate unique slug
    const baseSlug = slugify(title);
    const slug = baseSlug + "-" + Math.random().toString(36).slice(2, 8);

    const doc = await prisma.document.create({
      data: {
        title,
        slug,
        description: description || null,
        category,
        visibility,
        isPublished: published,
        fileUrl,
        fileName: fileName || null,
        mimeType: mimeType || null,
        fileSize: fileSize || 0,
        createdById: (session.user as any).id,
        tags: {
          create: tags.map((tagName: string) => ({ name: tagName }))
        }
      },
      include: { tags: true }
    });

    return NextResponse.json({ ok: true, document: doc }, { status: 201 });
  } catch (error) {
    console.error("Create document error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
