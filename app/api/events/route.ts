import { NextResponse } from "next/server";

import { EVENT_RETENTION_DAYS, parseProductEvent } from "@/lib/analytics/events";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/serverAuth";

const MAX_BODY_BYTES = 2_000;

export async function POST(request: Request) {
  const raw = await request.text().catch(() => "");
  if (!raw || raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const event = parseProductEvent(payload);
  if (!event) {
    // Unapproved event name or property: reject, never store.
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Authenticated events are associated with the internal user id only —
  // the email is never copied into analytics.
  const userId = await requireUserId();

  await prisma.productEvent.create({
    data: {
      name: event.name,
      visitorId: event.visitorId,
      userId,
      props: JSON.stringify(event.props),
    },
  });

  // Opportunistic retention pruning (no cron infra): ~2% of writes clear
  // events past the retention window.
  if (Math.random() < 0.02) {
    const cutoff = new Date(Date.now() - EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    await prisma.productEvent.deleteMany({ where: { createdAt: { lt: cutoff } } }).catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}
