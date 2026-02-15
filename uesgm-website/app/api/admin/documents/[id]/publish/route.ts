import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.response;
  const id = params.id;
  try {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.document.update({ where: { id }, data: { isPublished: !doc.isPublished } });
    return NextResponse.json({ ok: true, document: updated });
  } catch (err) {
    console.error("Publish error:", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
