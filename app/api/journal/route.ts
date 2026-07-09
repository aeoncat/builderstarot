import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createJournalSchema } from "@/lib/schemas";
import { serializeJournalEntry } from "@/lib/serializers";
import { requireUserId } from "@/lib/serverAuth";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.journalEntry.findMany({
    where: { userId },
    include: { cards: { include: { card: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(entries.map(serializeJournalEntry));
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createJournalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid journal payload" }, { status: 400 });
  }

  const { spreadType, notes, cards, spreadSessionId, ...snapshot } = parsed.data;

  const created = await prisma.journalEntry.create({
    data: {
      userId,
      spreadType,
      userNotes: notes,
      spreadSessionId,
      projectStage: snapshot.projectStage,
      subject: snapshot.subject,
      synthesisHeadline: snapshot.synthesisHeadline,
      synthesisSummary: snapshot.synthesisSummary,
      synthesisPriorityAction: snapshot.synthesisPriorityAction,
      engineVersion: snapshot.engineVersion,
      synthesisVersion: snapshot.synthesisVersion,
      cards: {
        create: cards.map((item, index) => ({
          cardId: item.cardId,
          orientation: item.orientation,
          positionName: item.positionName,
          sortOrder: index,
          interpretationText: item.interpretationText,
          nextActionText: item.nextActionText,
          reflectionQuestionText: item.reflectionQuestionText,
          positionRole: item.positionRole,
          cardContentVersion: item.cardContentVersion,
        })),
      },
    },
    include: { cards: { include: { card: true } } },
  });

  return NextResponse.json(serializeJournalEntry(created), { status: 201 });
}
