import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { serializeCard } from "@/lib/serializers";
import { requireUserId } from "@/lib/serverAuth";
import { getChicagoDateKey } from "@/lib/time";
import { getDeterministicDaily } from "@/lib/tarot";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dateKey = getChicagoDateKey();
  const existing = await prisma.dailyDraw.findUnique({
    where: {
      userId_dateKey: { userId, dateKey },
    },
    include: { card: true },
  });

  if (existing) {
    return NextResponse.json({
      dateKey,
      orientation: existing.orientation,
      card: serializeCard(existing.card),
      existing: true,
    });
  }

  const cards = await prisma.card.findMany({ orderBy: { id: "asc" } });
  const pick = getDeterministicDaily(cards, `${userId}:${dateKey}`, 30);

  const created = await prisma.dailyDraw.create({
    data: {
      userId,
      cardId: pick.card.id,
      orientation: pick.orientation,
      dateKey,
    },
    include: { card: true },
  });

  return NextResponse.json({
    dateKey,
    orientation: created.orientation,
    card: serializeCard(created.card),
    existing: false,
  });
}
