import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { z } from "zod";

const BODY = z.object({
  fileUrl: z.string().url(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  fileSize: z.number().int().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.response;
  const parsed = BODY.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const id = params.id;
  try {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const newVersion = (doc.version ?? 1) + 1;

    await prisma.$transaction([
      prisma.documentVersion.create({
        data: {
          documentId: id,
          fileUrl: parsed.data.fileUrl,
          version: newVersion,
        },
      }),
      prisma.document.update({
        where: { id },
        data: {
          fileUrl: parsed.data.fileUrl,
          fileName: parsed.data.fileName ?? doc.fileName,
          mimeType: parsed.data.mimeType ?? doc.mimeType,
          fileSize: parsed.data.fileSize ?? doc.fileSize,
          version: newVersion,
          updatedAt: new Date(),
        },
      }),
    ]);

    const updated = await prisma.document.findUnique({ where: { id }, include: { versions: true } });
    return NextResponse.json({ ok: true, document: updated });
  } catch (err) {
    console.error("New version error:", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
