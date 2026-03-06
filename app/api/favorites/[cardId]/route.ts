import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/serverAuth";

export async function POST(_: Request, { params }: { params: { cardId: string } }) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_cardId: { userId, cardId: params.cardId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  await prisma.favorite.create({ data: { userId, cardId: params.cardId } });
  return NextResponse.json({ favorited: true });
}
