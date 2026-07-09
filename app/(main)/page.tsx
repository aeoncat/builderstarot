import Link from "next/link";

import { CardIcon } from "@/components/cards/card-icon";
import { LandingTracker } from "@/components/validation/landing-tracker";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/serverAuth";

const ctas = [
  { href: "/draw", title: "Draw Cards", subtitle: "A focused single-card reading." },
  { href: "/daily", title: "Daily Card", subtitle: "One card, fixed for the day." },
  { href: "/spreads", title: "Spreads", subtitle: "Three and five-card layouts." },
];

export default async function HomePage() {
  const session = await getServerSession();

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
          take: 3,
          include: { cards: { include: { card: true } } },
        })
      : [],
  ]);

  return (
    <div className="space-y-14">
      <LandingTracker />
      <section className="grid min-h-[calc(100vh-10rem)] items-start gap-10 pt-24 sm:pt-28 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <h1 className="max-w-[760px] font-display text-5xl font-black leading-[0.98] tracking-normal text-[#f1eee7] sm:text-6xl lg:text-[4.45rem]">
            The cards that <span className="text-[#d0a657]">shape your work,</span> reading your patterns.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#9d98a8]">
            BuildersTarot translates archetypes, decisions, and momentum into readings you can use before the next sprint,
            launch, or hard conversation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/draw"
              className="rounded-lg bg-[#d0a657] px-6 py-3 text-sm font-black text-[#090810] shadow-[0_16px_36px_rgba(208,166,87,0.18)] transition-colors hover:bg-[#e0bc72]"
            >
              Draw Your Cards Now
            </Link>
            <Link
              href="/cards"
              className="rounded-lg border border-[#3d3322] bg-[#17151f] px-6 py-3 text-sm font-black text-[#d5cfda] transition-colors hover:text-[#f1eee7]"
            >
              Browse Library
            </Link>
          </div>
        </div>

        <div className="relative min-h-[390px] lg:pt-2">
          <div className="tarot-card-face absolute left-1/2 top-1/2 h-[330px] w-[214px] -translate-x-[38%] -translate-y-1/2 rotate-[-7deg] rounded-[24px] opacity-35" />
          <div className="tarot-card-face absolute left-1/2 top-1/2 h-[360px] w-[234px] -translate-x-[49%] -translate-y-[48%] rotate-[6deg] rounded-[24px] opacity-50" />
          <div className="tarot-card-face absolute left-1/2 top-1/2 flex h-[380px] w-[248px] -translate-x-1/2 -translate-y-1/2 rotate-[-3deg] flex-col items-center justify-between rounded-[24px] px-8 py-9">
            <p className="font-display text-xs font-black uppercase tracking-[0.48em] text-[#8e6d32]">XVII</p>
            <CardIcon cardName="The Builder" className="mt-20 h-14 w-14" strokeWidth={3} />
            <div className="text-center">
              <p className="font-display text-xl font-black text-[#d0a657]">The Builder</p>
              <p className="mt-3 text-[0.7rem] font-black uppercase tracking-[0.26em] text-[#9d98a8]">Major Arcana</p>
            </div>
            <p className="font-display text-[0.62rem] font-black uppercase tracking-[0.42em] text-[#6f552a]">Builderstarot</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {ctas.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full transition-transform hover:-translate-y-1 hover:border-[#d0a657]/45">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Reading</p>
              <h2 className="mt-4 font-display text-2xl font-black text-[#f1eee7]">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#9d98a8]">{item.subtitle}</p>
            </Card>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Today</p>
          <h2 className="mt-3 font-display text-3xl font-black text-[#f1eee7]">Daily Card</h2>
          {daily ? (
            <p className="mt-4 text-lg text-[#9d98a8]">
              {daily.card.name} <span className="text-[#706a7b]">drawn {daily.dateKey}</span>
            </p>
          ) : (
            <p className="mt-4 text-lg text-[#9d98a8]">Open Daily to draw today&apos;s card.</p>
          )}
        </Card>
        <Card>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Journal</p>
          <h2 className="mt-3 font-display text-3xl font-black text-[#f1eee7]">Recent Draws</h2>
          {session?.user && recentDraws.length > 0 ? (
            <div className="mt-4 space-y-2">
              {recentDraws.map((entry) => (
                <Link key={entry.id} href={`/journal/${entry.id}`} className="block text-sm text-[#9d98a8] hover:text-[#e0bc72]">
                  {new Date(entry.createdAt).toLocaleDateString()} / {entry.spreadType} / {entry.cards.length} card(s)
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-lg text-[#9d98a8]">Save readings to build your archive.</p>
          )}
        </Card>
      </section>
    </div>
  );
}
