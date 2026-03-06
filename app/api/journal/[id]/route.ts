import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { updateJournalSchema } from "@/lib/schemas";
import { serializeJournalEntry } from "@/lib/serializers";
import { requireUserId } from "@/lib/serverAuth";

async function getOwnedEntry(userId: string, id: string) {
  return prisma.journalEntry.findFirst({
    where: { id, userId },
    include: { cards: { include: { card: true } } },
  });
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entry = await getOwnedEntry(userId, params.id);
  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(serializeJournalEntry(entry));
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateJournalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid notes" }, { status: 400 });
  }

  const existing = await prisma.journalEntry.findFirst({ where: { id: params.id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.journalEntry.update({
    where: { id: params.id },
    data: { userNotes: parsed.data.notes },
    include: { cards: { include: { card: true } } },
  });

  return NextResponse.json(serializeJournalEntry(updated));
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.journalEntry.findFirst({ where: { id: params.id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.journalEntry.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
