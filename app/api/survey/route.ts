import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { surveySchema } from "@/lib/schemas";
import { requireUserId } from "@/lib/serverAuth";

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = surveySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid survey response." }, { status: 400 });
  }

  // One response per user; a resubmission updates rather than duplicates.
  await prisma.surveyResponse.upsert({
    where: { userId },
    create: { userId, ...parsed.data },
    update: parsed.data,
  });

  return NextResponse.json({ ok: true });
}
