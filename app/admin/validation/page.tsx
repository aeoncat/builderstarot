import { notFound } from "next/navigation";

import {
  type EventRow,
  dayNRetention,
  engagedProViewers,
  firstReadingCompletionRate,
  formatRate,
  guestVsAuthed,
  interviewVolunteers,
  journalSaveRate,
  medianTimeToFirstReadingMs,
  multiDayUsers,
  multiReadingUsers,
  planPreferenceDistribution,
  proFunnel,
  proPageViews,
  projectReadingCompletionRate,
  readingTypeBreakdown,
  readingsPerReturningUser,
  registeredUsers,
  smallSampleWarning,
  totalCompletedReadings,
  uniqueVisitors,
  weeklyReturningReaders,
} from "@/lib/analytics/metrics";
import { isOwnerEmail } from "@/lib/owner";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

function parseRangeDays(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "30", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 30;
  return Math.min(parsed, 180);
}

export default async function ValidationDashboardPage({
  searchParams,
}: {
  searchParams: { days?: string };
}) {
  const session = await getServerSession();
  if (!isOwnerEmail(session?.user?.email, process.env.OWNER_EMAILS)) {
    notFound();
  }

  const rangeDays = parseRangeDays(searchParams.days);
  const asOf = new Date();
  const since = new Date(asOf.getTime() - rangeDays * 86_400_000);

  const [eventRecords, waitlistEntries, surveyResponses] = await Promise.all([
    prisma.productEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { name: true, visitorId: true, userId: true, createdAt: true, props: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.waitlistEntry.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.surveyResponse.findMany(),
  ]);

  const rows: EventRow[] = eventRecords;
  const visitors = uniqueVisitors(rows);
  const d1 = dayNRetention(rows, 1, asOf);
  const d7 = dayNRetention(rows, 7, asOf);
  const d30 = dayNRetention(rows, 30, asOf);
  const funnel = proFunnel(rows);
  const proViews = proPageViews(rows);
  const planDistribution = planPreferenceDistribution(rows);
  const surfaces = readingTypeBreakdown(rows);
  const split = guestVsAuthed(rows);
  const medianMs = medianTimeToFirstReadingMs(rows);
  const warning = smallSampleWarning(visitors);

  const waitlistPlans: Record<string, number> = {};
  for (const entry of waitlistEntries) {
    waitlistPlans[entry.planPreference] = (waitlistPlans[entry.planPreference] ?? 0) + 1;
  }
  const surveyPrices: Record<string, number> = {};
  for (const response of surveyResponses) {
    surveyPrices[response.pricePreference] = (surveyPrices[response.pricePreference] ?? 0) + 1;
  }
  const surveyInterviewOptIns = surveyResponses.filter((r) => r.interviewOptIn).length;
  const waitlistInterviewOptIns = waitlistEntries.filter((r) => r.interviewOptIn).length;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10 text-sm">
      <div>
        <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Owner only</p>
        <h1 className="mt-1 font-display text-3xl font-black">Validation Dashboard</h1>
        <p className="mt-1 text-muted">
          Last {rangeDays} days · as of {asOf.toISOString().slice(0, 16).replace("T", " ")} UTC · range:{" "}
          {[7, 30, 90, 180].map((d) => (
            <a key={d} href={`?days=${d}`} className="mr-2 underline">
              {d}d
            </a>
          ))}
        </p>
      </div>

      {warning ? (
        <p className="rounded border border-[#d0a657]/50 bg-[#d0a657]/10 p-3 font-semibold">{warning}</p>
      ) : null}

      <Section title="Reach & activation">
        <Row label="Unique visitors (identities with any event)" value={visitors} />
        <Row label="Registered users (account_created)" value={registeredUsers(rows)} />
        <Row label="Completed readings (all surfaces)" value={totalCompletedReadings(rows)} />
        <Row label="First-reading completion rate" value={formatRate(firstReadingCompletionRate(rows))} />
        <Row label="Project-reading completion rate (started → completed)" value={formatRate(projectReadingCompletionRate(rows))} />
        <Row
          label="Median time to first completed reading"
          value={medianMs === null ? "—" : `${Math.round(medianMs / 1000)}s`}
        />
      </Section>

      <Section title="Retention">
        <Row label={`D1 return (${d1.eligible} eligible)`} value={formatRate(d1.rate)} />
        <Row label={`D7 return (${d7.eligible} eligible)`} value={formatRate(d7.rate)} />
        <Row label={`D30 return (${d30.eligible} eligible)`} value={d30.eligible === 0 ? "too early" : formatRate(d30.rate)} />
        <Row label="Weekly returning readers (≥2 reading days in last 7)" value={weeklyReturningReaders(rows, asOf)} />
        <Row label="Users with ≥3 completed readings" value={multiReadingUsers(rows, 3)} />
        <Row label="Users active on >1 day" value={multiDayUsers(rows)} />
        <Row
          label="Avg completed readings per returning user"
          value={readingsPerReturningUser(rows)?.toFixed(1) ?? "—"}
        />
        <Row label="Journal-save rate (savers ÷ readers)" value={formatRate(journalSaveRate(rows))} />
      </Section>

      <Section title="Reading surfaces (completed)">
        {Object.entries(surfaces).length === 0 ? (
          <Row label="No completed readings in range" value="—" />
        ) : (
          Object.entries(surfaces)
            .sort((a, b) => b[1] - a[1])
            .map(([surface, count]) => <Row key={surface} label={surface} value={count} />)
        )}
        <Row label="Guest identities" value={split.guest} />
        <Row label="Authenticated identities" value={split.authed} />
      </Section>

      <Section title="Pro interest">
        <Row label="Pro-page views (total / unique)" value={`${proViews.total} / ${proViews.uniqueViewers}`} />
        <Row label="Pro viewers with ≥3 readings" value={engagedProViewers(rows)} />
        <Row label="Plan-selection rate among viewers" value={formatRate(funnel.planSelectionRate)} />
        <Row label="Waitlist join rate among viewers" value={formatRate(funnel.waitlistJoinRate)} />
        <Row label="Waitlist signups (total stored)" value={waitlistEntries.length} />
        {Object.entries(planDistribution).map(([plan, count]) => (
          <Row key={plan} label={`Plan selected: ${plan}`} value={count} />
        ))}
        {Object.entries(waitlistPlans).map(([plan, count]) => (
          <Row key={`wl-${plan}`} label={`Waitlist preference: ${plan}`} value={count} />
        ))}
      </Section>

      <Section title="Survey & interviews">
        <Row label="Survey responses" value={surveyResponses.length} />
        {Object.entries(surveyPrices).map(([price, count]) => (
          <Row key={price} label={`Survey price preference: ${price}`} value={count} />
        ))}
        <Row label="Interview volunteers (survey / waitlist)" value={`${surveyInterviewOptIns} / ${waitlistInterviewOptIns}`} />
        <Row label="Interview interest events" value={interviewVolunteers(rows)} />
      </Section>

      <Section title="Waitlist export">
        <p className="text-muted">
          <a href="/api/admin/waitlist-export" className="underline">
            Download CSV (owner only)
          </a>{" "}
          — no email provider is configured; unsubscribe requests are handled manually until one exists.
        </p>
      </Section>

      <p className="text-xs text-muted">
        Thresholds and formulas: docs/validation-plan.md. These are directional early-stage signals, not
        guarantees. Waitlist signups do not prove willingness to pay — that requires the founding-member
        presale experiment.
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border p-4">
      <h2 className="mb-3 font-display text-lg font-black">{title}</h2>
      <div className="divide-y divide-[#3d3322]/30">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span>{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}
