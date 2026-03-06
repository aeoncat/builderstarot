import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { cardQuerySchema } from "@/lib/schemas";
import { serializeCard } from "@/lib/serializers";
import { requireUserId } from "@/lib/serverAuth";

export async function GET(request: NextRequest) {
  const userId = await requireUserId();
  const query = cardQuerySchema.safeParse({
    search: request.nextUrl.searchParams.get("search") ?? undefined,
    arcana: request.nextUrl.searchParams.get("arcana") ?? undefined,
    suit: request.nextUrl.searchParams.get("suit") ?? undefined,
    rank: request.nextUrl.searchParams.get("rank") ?? undefined,
  });

  if (!query.success) {
    return NextResponse.json({ error: "Invalid filters." }, { status: 400 });
  }

  const { search, arcana, suit, rank } = query.data;

  const cards = await prisma.card.findMany({
    where: {
      arcana,
      suit,
      rank,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { uprightMeaning: { contains: search } },
              { reversedMeaning: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: [{ arcana: "asc" }, { suit: "asc" }, { name: "asc" }],
  });

  let favoriteIds = new Set<string>();
  if (userId) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: { cardId: true },
    });
    favoriteIds = new Set(favorites.map((item) => item.cardId));
  }

  return NextResponse.json(cards.map((card) => ({ ...serializeCard(card), favorited: favoriteIds.has(card.id) })));
}
