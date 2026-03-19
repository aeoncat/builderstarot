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
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        You are signed in as <span className="font-medium text-slate-300">{session.user.email ?? "unknown email"}</span>.
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-600 dark:text-slate-400">Favorites</p>
          <p className="mt-1 text-3xl font-semibold">{favoriteCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-600 dark:text-slate-400">Journal entries</p>
          <p className="mt-1 text-3xl font-semibold">{journalCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-600 dark:text-slate-400">Latest spread</p>
          <p className="mt-1 text-xl font-semibold capitalize">{latestJournal?.spreadType ?? "None yet"}</p>
        </Card>
      </div>
    </div>
  );
}
