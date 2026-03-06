import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { serializeCard } from "@/lib/serializers";
import { requireUserId } from "@/lib/serverAuth";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const card = await prisma.card.findUnique({ where: { id: params.id } });

  if (!card) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  const favorited = userId
    ? Boolean(await prisma.favorite.findUnique({ where: { userId_cardId: { userId, cardId: card.id } } }))
    : false;

  return NextResponse.json({ ...serializeCard(card), favorited });
}
