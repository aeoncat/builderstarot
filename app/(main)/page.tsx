import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ctas = [
  { href: "/draw", title: "Draw a Card", subtitle: "Single ritual draw with interpretation." },
  { href: "/daily", title: "Daily Card", subtitle: "One deterministic card per day." },
  { href: "/spreads", title: "Spreads", subtitle: "Use 1, 3, and 5 card layouts." },
  { href: "/journal", title: "Journal", subtitle: "Review and edit your reflections." },
];

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  const [daily, recentDraws] = await Promise.all([
    session?.user?.id
      ? prisma.dailyDraw.findFirst({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          include: { card: true },
        })
      : null,
    session?.user?.id
      ? prisma.journalEntry.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { cards: { include: { card: true } } },
        })
      : [],
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-5xl font-semibold tracking-tight text-[#e5ddd0] md:text-6xl">Builder&apos;s Tarot</h1>
        <p className="mt-3 max-w-3xl text-[2rem] leading-relaxed text-[#acb4c0] md:text-[2.05rem]">
          custom suits, renamed court cards, and a ritual-like draw flow for builders
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ctas.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border border-[#243248] bg-[#0a1428]/45 p-3 shadow-[inset_0_1px_0_rgba(204,173,119,0.1)] transition-colors hover:border-[#34506e]"
          >
            <div className="rounded-xl border border-[#4e3f2a] bg-gradient-to-r from-[#4f4632] to-[#664727] px-4 py-3 text-center text-xl font-semibold text-[#d39e43]">
              {item.title}
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#243248] bg-[#081020]/78 p-6">
          <h2 className="text-5xl font-semibold leading-none text-[#d7dde8]">today&apos;s daily card</h2>
          {daily ? (
            <p className="mt-4 text-3xl text-[#b5beca]">
              {daily.card.name} <span className="text-[#8f99a8]">(drawn {daily.dateKey})</span>
            </p>
          ) : (
            <p className="mt-4 text-3xl text-[#b5beca]">no daily card yet. open daily to draw today&apos;s card.</p>
          )}
        </div>
        <div className="rounded-2xl border border-[#243248] bg-[#081020]/78 p-6">
          <h2 className="text-5xl font-semibold leading-none text-[#d7dde8]">recent draws</h2>
          {session?.user ? (
            recentDraws.length > 0 ? (
              <div className="mt-3 space-y-2 text-2xl text-[#b5beca]">
                {recentDraws.slice(0, 3).map((entry) => (
                  <Link key={entry.id} href={`/journal/${entry.id}`} className="block hover:text-[#e4c486]">
                    {new Date(entry.createdAt).toLocaleDateString()} · {entry.spreadType} · {entry.cards.length} card(s)
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-3xl text-[#b5beca]">no draws yet. draw a card to start your log.</p>
            )
          ) : (
            <p className="mt-4 text-3xl text-[#b5beca]">sign in to sync and view your last 5 draws here.</p>
          )}
        </div>
      </section>
    </div>
  );
}
