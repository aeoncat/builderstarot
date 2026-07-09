import { NextResponse } from "next/server";

import { isOwnerEmail } from "@/lib/owner";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export async function GET() {
  const session = await getServerSession();
  if (!isOwnerEmail(session?.user?.email, process.env.OWNER_EMAILS)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const entries = await prisma.waitlistEntry.findMany({ orderBy: { createdAt: "asc" } });
  const header = "email,planPreference,interviewOptIn,updatesConsent,source,createdAt";
  const lines = entries.map((entry) =>
    [
      csvEscape(entry.email),
      entry.planPreference,
      String(entry.interviewOptIn),
      String(entry.updatesConsent),
      entry.source ?? "",
      entry.createdAt.toISOString(),
    ].join(","),
  );

  return new NextResponse([header, ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=builders-tarot-waitlist.csv",
    },
  });
}
