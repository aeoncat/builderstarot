import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { waitlistSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = waitlistSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid waitlist request." }, { status: 400 });
  }

  const { email, planPreference, interviewOptIn, updatesConsent, website } = parsed.data;

  if (!updatesConsent) {
    return NextResponse.json({ error: "Consent to product updates is required to join." }, { status: 400 });
  }

  // Honeypot triggered: report success without storing anything.
  if (website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  // Duplicate emails update their preference instead of erroring — the
  // response is identical either way, so membership is not disclosed.
  await prisma.waitlistEntry.upsert({
    where: { email },
    create: { email, planPreference, interviewOptIn, updatesConsent, source: "pro-page" },
    update: { planPreference, interviewOptIn, updatesConsent },
  });

  return NextResponse.json({ ok: true });
}
