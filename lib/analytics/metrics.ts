/**
 * Validation metrics: pure functions over product-event rows.
 *
 * Every formula the dashboard reports is defined here (and documented in
 * docs/validation-plan.md) so metrics cannot silently change. All functions
 * are deterministic and DB-free — the dashboard fetches rows, these compute.
 *
 * Identity: events are keyed by `userId` when present, otherwise `visitorId`.
 * Because the visitor id persists across signup, a guest's pre-signup events
 * share the visitorId of their post-signup events; identity() prefers the
 * visitorId join when both exist so pre/post-signup activity merges naturally.
 */

export type EventRow = {
  name: string;
  visitorId: string;
  userId: string | null;
  createdAt: Date;
  props?: string;
};

const COMPLETED_READING_EVENTS = new Set(["reading_completed", "project_reading_completed"]);

export function identity(row: EventRow): string {
  return row.visitorId || (row.userId ? `u:${row.userId}` : "unknown");
}

export function isAuthedIdentity(rows: EventRow[], id: string): boolean {
  return rows.some((row) => identity(row) === id && row.userId !== null);
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function groupByIdentity(rows: EventRow[]): Map<string, EventRow[]> {
  const map = new Map<string, EventRow[]>();
  for (const row of rows) {
    const id = identity(row);
    const list = map.get(id);
    if (list) list.push(row);
    else map.set(id, [row]);
  }
  return map;
}

function completedReadings(rows: EventRow[]): EventRow[] {
  return rows.filter((row) => COMPLETED_READING_EVENTS.has(row.name));
}

// ---------- Activation ----------

/** Distinct identities with at least one event in range. */
export function uniqueVisitors(rows: EventRow[]): number {
  return groupByIdentity(rows).size;
}

/** Distinct identities with at least one account_created event. */
export function registeredUsers(rows: EventRow[]): number {
  return new Set(rows.filter((r) => r.name === "account_created").map(identity)).size;
}

export function totalCompletedReadings(rows: EventRow[]): number {
  return completedReadings(rows).length;
}

/** First-reading completion rate = identities with >=1 completed reading ÷ unique visitors. */
export function firstReadingCompletionRate(rows: EventRow[]): number | null {
  const visitors = uniqueVisitors(rows);
  if (visitors === 0) return null;
  const completed = new Set(completedReadings(rows).map(identity)).size;
  return completed / visitors;
}

/** Project-reading completion rate = identities completing ÷ identities starting a project reading. */
export function projectReadingCompletionRate(rows: EventRow[]): number | null {
  const started = new Set(rows.filter((r) => r.name === "project_reading_started").map(identity));
  if (started.size === 0) return null;
  const completed = new Set(rows.filter((r) => r.name === "project_reading_completed").map(identity));
  let both = 0;
  completed.forEach((id) => {
    if (started.has(id)) both += 1;
  });
  return both / started.size;
}

/** Median milliseconds from an identity's first event to its first completed reading. */
export function medianTimeToFirstReadingMs(rows: EventRow[]): number | null {
  const byId = groupByIdentity(rows);
  const durations: number[] = [];
  byId.forEach((events) => {
    const sorted = [...events].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const first = sorted[0];
    const firstCompleted = sorted.find((e) => COMPLETED_READING_EVENTS.has(e.name));
    if (first && firstCompleted) durations.push(firstCompleted.createdAt.getTime() - first.createdAt.getTime());
  });
  if (durations.length === 0) return null;
  durations.sort((a, b) => a - b);
  return durations[Math.floor(durations.length / 2)];
}

// ---------- Retention ----------

export type CohortRetention = {
  /** Identities old enough to qualify (first seen >= `windowDays` before `asOf`). */
  eligible: number;
  returned: number;
  rate: number | null;
};

/**
 * Dn retention: an identity "returns at Dn" when it has any event on a
 * calendar day within [first-seen day + 1, first-seen day + windowDays].
 * An identity is only eligible once its full return window has elapsed —
 * i.e. `asOf` is past the END of day (first-seen + windowDays) — so nobody
 * is judged "not returned" while their window is still open.
 */
export function dayNRetention(rows: EventRow[], windowDays: number, asOf: Date): CohortRetention {
  const byId = groupByIdentity(rows);
  let eligible = 0;
  let returned = 0;
  const asOfMs = asOf.getTime();
  byId.forEach((events) => {
    const days = Array.from(new Set(events.map((e) => dayKey(e.createdAt)))).sort();
    const firstDay = days[0];
    const firstDayMs = new Date(`${firstDay}T00:00:00Z`).getTime();
    if (asOfMs < firstDayMs + (windowDays + 1) * 86_400_000) return; // window still open
    eligible += 1;
    const windowEnd = dayKey(new Date(firstDayMs + windowDays * 86_400_000));
    if (days.some((d) => d > firstDay && d <= windowEnd)) returned += 1;
  });
  return { eligible, returned, rate: eligible === 0 ? null : returned / eligible };
}

/**
 * Weekly returning readers: identities with completed readings on at least two
 * distinct calendar days within the rolling 7-day window ending at `asOf`.
 */
export function weeklyReturningReaders(rows: EventRow[], asOf: Date): number {
  const windowStart = asOf.getTime() - 7 * 86_400_000;
  const readingRows = completedReadings(rows).filter(
    (r) => r.createdAt.getTime() > windowStart && r.createdAt.getTime() <= asOf.getTime(),
  );
  const daysById = new Map<string, Set<string>>();
  for (const row of readingRows) {
    const id = identity(row);
    const set = daysById.get(id) ?? new Set<string>();
    set.add(dayKey(row.createdAt));
    daysById.set(id, set);
  }
  let count = 0;
  daysById.forEach((days) => {
    if (days.size >= 2) count += 1;
  });
  return count;
}

/** Identities with at least `minimum` completed readings. */
export function multiReadingUsers(rows: EventRow[], minimum = 3): number {
  const counts = new Map<string, number>();
  for (const row of completedReadings(rows)) {
    const id = identity(row);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  let qualifying = 0;
  counts.forEach((count) => {
    if (count >= minimum) qualifying += 1;
  });
  return qualifying;
}

/** Identities with events on more than one distinct calendar day. */
export function multiDayUsers(rows: EventRow[]): number {
  const byId = groupByIdentity(rows);
  let count = 0;
  byId.forEach((events) => {
    if (new Set(events.map((e) => dayKey(e.createdAt))).size > 1) count += 1;
  });
  return count;
}

/** Average completed readings per identity that returned on a later day. */
export function readingsPerReturningUser(rows: EventRow[]): number | null {
  const byId = groupByIdentity(rows);
  let returningUsers = 0;
  let readings = 0;
  byId.forEach((events) => {
    const days = new Set(events.map((e) => dayKey(e.createdAt)));
    if (days.size < 2) return;
    returningUsers += 1;
    readings += events.filter((e) => COMPLETED_READING_EVENTS.has(e.name)).length;
  });
  return returningUsers === 0 ? null : readings / returningUsers;
}

// ---------- Engagement ----------

/** Journal-save rate = identities with journal_entry_saved ÷ identities with a completed reading. */
export function journalSaveRate(rows: EventRow[]): number | null {
  const readers = new Set(completedReadings(rows).map(identity));
  if (readers.size === 0) return null;
  const savers = new Set(rows.filter((r) => r.name === "journal_entry_saved").map(identity));
  let both = 0;
  savers.forEach((id) => {
    if (readers.has(id)) both += 1;
  });
  return both / readers.size;
}

/** Completed readings by surface (from the approved `surface` prop). */
export function readingTypeBreakdown(rows: EventRow[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  for (const row of completedReadings(rows)) {
    let surface = "unknown";
    try {
      const props = JSON.parse(row.props ?? "{}") as { surface?: string };
      if (typeof props.surface === "string") surface = props.surface;
    } catch {
      // ignore malformed props
    }
    breakdown[surface] = (breakdown[surface] ?? 0) + 1;
  }
  return breakdown;
}

/** Split any per-identity metric into guest vs authenticated groups. */
export function guestVsAuthed(rows: EventRow[]): { guest: number; authed: number } {
  const byId = groupByIdentity(rows);
  let guest = 0;
  let authed = 0;
  byId.forEach((events) => {
    if (events.some((e) => e.userId !== null)) authed += 1;
    else guest += 1;
  });
  return { guest, authed };
}

// ---------- Willingness-to-pay interest ----------

export function proPageViews(rows: EventRow[]): { total: number; uniqueViewers: number } {
  const views = rows.filter((r) => r.name === "pro_page_viewed");
  return { total: views.length, uniqueViewers: new Set(views.map(identity)).size };
}

/** Pro-page viewers who had >=3 completed readings anywhere in range. */
export function engagedProViewers(rows: EventRow[]): number {
  const counts = new Map<string, number>();
  for (const row of completedReadings(rows)) {
    const id = identity(row);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const viewers = new Set(rows.filter((r) => r.name === "pro_page_viewed").map(identity));
  let engaged = 0;
  viewers.forEach((id) => {
    if ((counts.get(id) ?? 0) >= 3) engaged += 1;
  });
  return engaged;
}

/** Distribution of pro_plan_selected by the approved `plan` prop (last selection per identity wins). */
export function planPreferenceDistribution(rows: EventRow[]): Record<string, number> {
  const lastByIdentity = new Map<string, string>();
  const sorted = rows
    .filter((r) => r.name === "pro_plan_selected")
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  for (const row of sorted) {
    try {
      const props = JSON.parse(row.props ?? "{}") as { plan?: string };
      if (typeof props.plan === "string") lastByIdentity.set(identity(row), props.plan);
    } catch {
      // ignore malformed props
    }
  }
  const distribution: Record<string, number> = {};
  lastByIdentity.forEach((plan) => {
    distribution[plan] = (distribution[plan] ?? 0) + 1;
  });
  return distribution;
}

/** Conversion steps among pro-page viewers. */
export function proFunnel(rows: EventRow[]): {
  viewers: number;
  planSelectors: number;
  waitlistStarters: number;
  waitlistJoiners: number;
  planSelectionRate: number | null;
  waitlistJoinRate: number | null;
} {
  const viewers = new Set(rows.filter((r) => r.name === "pro_page_viewed").map(identity));
  const selectors = new Set(rows.filter((r) => r.name === "pro_plan_selected").map(identity));
  const starters = new Set(rows.filter((r) => r.name === "pro_waitlist_started").map(identity));
  const joiners = new Set(rows.filter((r) => r.name === "pro_waitlist_joined").map(identity));
  return {
    viewers: viewers.size,
    planSelectors: selectors.size,
    waitlistStarters: starters.size,
    waitlistJoiners: joiners.size,
    planSelectionRate: viewers.size === 0 ? null : selectors.size / viewers.size,
    waitlistJoinRate: viewers.size === 0 ? null : joiners.size / viewers.size,
  };
}

export function interviewVolunteers(rows: EventRow[]): number {
  return new Set(rows.filter((r) => r.name === "interview_interest_submitted").map(identity)).size;
}

// ---------- Presentation helpers ----------

export function formatRate(rate: number | null): string {
  return rate === null ? "—" : `${(rate * 100).toFixed(1)}%`;
}

export const SMALL_SAMPLE_THRESHOLD = 30;

export function smallSampleWarning(sampleSize: number): string | null {
  if (sampleSize >= SMALL_SAMPLE_THRESHOLD) return null;
  return `Only ${sampleSize} ${sampleSize === 1 ? "user is" : "users are"} included. Treat percentages as directional, not conclusive.`;
}
