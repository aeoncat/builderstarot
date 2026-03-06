import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { drawRequestSchema } from "@/lib/schemas";
import { serializeCard } from "@/lib/serializers";
import { requireUserId } from "@/lib/serverAuth";
import { drawCards } from "@/lib/tarot";

export async function POST(request: Request) {
  const userId = await requireUserId();
  const body = await request.json().catch(() => null);
  const parsed = drawRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid draw request." }, { status: 400 });
  }

  const { spreadType, positions, reversedChance } = parsed.data;

  const cards = await prisma.card.findMany({ orderBy: { createdAt: "asc" } });

  if (cards.length < positions.length) {
    return NextResponse.json({ error: "Not enough cards in deck." }, { status: 400 });
  }

  const picked = drawCards(cards, positions.length, reversedChance);

  let spreadSessionId: string | null = null;
  if (userId) {
    const session = await prisma.spreadSession.create({
      data: {
        userId,
        spreadType,
        cards: {
          create: picked.map((item, index) => ({
            cardId: item.card.id,
            positionName: positions[index],
            orientation: item.orientation,
            sortOrder: index,
          })),
        },
      },
    });
    spreadSessionId = session.id;
  }

  return NextResponse.json({
    spreadType,
    spreadSessionId,
    cards: picked.map((item, index) => ({
      positionName: positions[index],
      orientation: item.orientation,
      card: serializeCard(item.card),
    })),
  });
}
