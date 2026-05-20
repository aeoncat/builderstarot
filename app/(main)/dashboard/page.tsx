import { redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/serverAuth";

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login");
  }

  const [favoriteCount, journalCount, latestJournal] = await Promise.all([
    prisma.favorite.count({ where: { userId: session.user.id } }),
    prisma.journalEntry.count({ where: { userId: session.user.id } }),
    prisma.journalEntry.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { cards: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Workspace</p>
        <h1 className="mt-2 font-display text-4xl font-black text-[#f1eee7]">Dashboard</h1>
      </div>
      <p className="text-sm text-[#9d98a8]">
        Signed in as <span className="font-medium text-[#f1eee7]">{session.user.email ?? "unknown email"}</span>.
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Favorites</p>
          <p className="mt-3 font-display text-4xl font-black text-[#f1eee7]">{favoriteCount}</p>
        </Card>
        <Card>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Journal Entries</p>
          <p className="mt-3 font-display text-4xl font-black text-[#f1eee7]">{journalCount}</p>
        </Card>
        <Card>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Latest Spread</p>
          <p className="mt-3 font-display text-2xl font-black capitalize text-[#f1eee7]">{latestJournal?.spreadType ?? "None yet"}</p>
        </Card>
      </div>
    </div>
  );
}
