import { NextRequest, NextResponse } from "next/server";

import { CURRENT_DECK_CARD_NAMES, sortByCreatorMajorOrder } from "@/lib/card-deck";
import { prisma } from "@/lib/prisma";
import { cardQuerySchema } from "@/lib/schemas";
import { serializeCard } from "@/lib/serializers";
import { requireUserId } from "@/lib/serverAuth";

export async function GET(request: NextRequest) {
  const userId = await requireUserId();
  const query = cardQuerySchema.safeParse({
    search: request.nextUrl.searchParams.get("search") ?? undefined,
  });

  if (!query.success) {
    return NextResponse.json({ error: "Invalid filters." }, { status: 400 });
  }

  const { search } = query.data;

  const cards = await prisma.card.findMany({
    where: {
      arcana: "MAJOR",
      name: { in: CURRENT_DECK_CARD_NAMES },
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
    orderBy: { name: "asc" },
  });

  let favoriteIds = new Set<string>();
  if (userId) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: { cardId: true },
    });
    favoriteIds = new Set(favorites.map((item) => item.cardId));
  }

  return NextResponse.json(
    sortByCreatorMajorOrder(cards).map((card) => ({ ...serializeCard(card), favorited: favoriteIds.has(card.id) })),
  );
}
