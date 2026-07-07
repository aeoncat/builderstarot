import { NextResponse } from "next/server";

import { DAILY_REVERSED_CHANCE, selectDailyDraw } from "@/lib/daily";
import { prisma } from "@/lib/prisma";
import { serializeCard } from "@/lib/serializers";
import { requireUserId } from "@/lib/serverAuth";
import { getChicagoDateKey } from "@/lib/time";

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

  // Only the current 22-card deck is eligible for new daily draws; retained
  // legacy cards stay in the table for historical records but are filtered out.
  const cards = await prisma.card.findMany();
  const pick = selectDailyDraw(cards, `${userId}:${dateKey}`, DAILY_REVERSED_CHANCE);
  if (!pick.card) {
    return NextResponse.json({ error: "No cards available." }, { status: 503 });
  }

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
