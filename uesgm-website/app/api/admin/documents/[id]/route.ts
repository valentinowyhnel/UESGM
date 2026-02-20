import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma-wrapper";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DocumentCategory, DocumentVisibility } from "@/types/documents";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { emitDocumentEvent } from "@/lib/sse";

const updateDocSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  category: z.nativeEnum(DocumentCategory).optional(),
  visibility: z.nativeEnum(DocumentVisibility).optional(),
  canDownload: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  fileSize: z.number().int().optional(),
  published: z.boolean().optional(),
});

// GET - Get single document (admin)
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !((session.user as any)?.role === 'ADMIN' || (session.user as any)?.role === 'SUPER_ADMIN')) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const doc = await prisma.document.findUnique({ 
      where: { id: params.id },
      include: { tags: true, versions: true }
    });
    
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    
    return NextResponse.json(doc);
  } catch (error) {
    console.error("Get document error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH - Update document (admin)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !((session.user as any)?.role === 'ADMIN' || (session.user as any)?.role === 'SUPER_ADMIN')) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parse = updateDocSchema.safeParse(body);
    
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }

    const { title, description, category, visibility, canDownload, tags, fileUrl, fileName, mimeType, fileSize, published } = parse.data;

    // Build update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category as any;
    if (visibility !== undefined) updateData.visibility = visibility as any;
    if (canDownload !== undefined) updateData.canDownload = canDownload;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
    if (fileName !== undefined) updateData.fileName = fileName;
    if (mimeType !== undefined) updateData.mimeType = mimeType;
    if (fileSize !== undefined) updateData.fileSize = fileSize;
    if (published !== undefined) updateData.isPublished = published;

    // Handle tags update
    if (tags !== undefined) {
      // Delete existing tags and create new ones
      await prisma.documentTag.deleteMany({
        where: { documentId: params.id }
      });
      updateData.tags = {
        create: tags.map((tagName: string) => ({ name: tagName }))
      };
    }

    const updated = await prisma.document.update({
      where: { id: params.id },
      data: updateData,
      include: { tags: true }
    });

    // Revalidation du cache - toujours rafraichir les pages admin
    revalidatePath('/admin/bibliotheque')
    revalidatePath('/admin/documents')
    if (published === true) {
      revalidatePath('/bibliotheque')
      revalidatePath(`/bibliotheque/${params.id}`)
    }

    // Émettre un événement SSE pour notifier les clients connectés
    emitDocumentEvent(published ? 'document:published' : 'document:updated', {
      id: updated.id,
      title: updated.title,
      slug: updated.slug,
      isPublished: updated.isPublished,
      category: updated.category,
      updatedAt: updated.updatedAt.toISOString()
    })

    return NextResponse.json({ ok: true, document: updated });
  } catch (error) {
    console.error("Update document error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE - Delete document (admin)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !((session.user as any)?.role === 'ADMIN' || (session.user as any)?.role === 'SUPER_ADMIN')) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = params.id;

  try {
    // Check if document exists
    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    
    // Permanent delete
    await prisma.document.delete({ where: { id } });
    
    // Revalidate cache
    revalidatePath('/bibliotheque')
    revalidatePath('/admin/documents')
    
    // Émettre un événement SSE pour notifier les clients connectés
    emitDocumentEvent('document:deleted', {
      id: existing.id,
      title: existing.title,
      slug: existing.slug,
      updatedAt: new Date().toISOString()
    })
    
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete doc error:", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
