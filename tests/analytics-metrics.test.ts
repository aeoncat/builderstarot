import { describe, expect, it } from "vitest";

import {
  type EventRow,
  dayNRetention,
  firstReadingCompletionRate,
  guestVsAuthed,
  journalSaveRate,
  multiReadingUsers,
  planPreferenceDistribution,
  proFunnel,
  projectReadingCompletionRate,
  readingTypeBreakdown,
  smallSampleWarning,
  uniqueVisitors,
  weeklyReturningReaders,
} from "@/lib/analytics/metrics";

function row(name: string, visitorId: string, iso: string, userId: string | null = null, props?: object): EventRow {
  return { name, visitorId, userId, createdAt: new Date(iso), props: props ? JSON.stringify(props) : "{}" };
}

const ASOF = new Date("2026-07-20T12:00:00Z");

describe("activation metrics", () => {
  it("computes first-reading completion over unique visitors", () => {
    const rows = [
      row("landing_viewed", "a", "2026-07-01T10:00:00Z"),
      row("reading_completed", "a", "2026-07-01T10:02:00Z"),
      row("landing_viewed", "b", "2026-07-01T11:00:00Z"),
    ];
    expect(uniqueVisitors(rows)).toBe(2);
    expect(firstReadingCompletionRate(rows)).toBeCloseTo(0.5);
  });

  it("computes project-reading completion from started to completed", () => {
    const rows = [
      row("project_reading_started", "a", "2026-07-01T10:00:00Z"),
      row("project_reading_completed", "a", "2026-07-01T10:01:00Z"),
      row("project_reading_started", "b", "2026-07-01T10:00:00Z"), // abandoned setup
    ];
    expect(projectReadingCompletionRate(rows)).toBeCloseTo(0.5);
  });

  it("returns null rates on empty data instead of fake zeros", () => {
    expect(firstReadingCompletionRate([])).toBeNull();
    expect(projectReadingCompletionRate([])).toBeNull();
    expect(journalSaveRate([])).toBeNull();
  });
});

describe("retention cohorts", () => {
  it("computes D1: return on the calendar day after first activity", () => {
    const rows = [
      row("reading_completed", "a", "2026-07-01T10:00:00Z"),
      row("return_visit", "a", "2026-07-02T09:00:00Z"), // D1 return
      row("reading_completed", "b", "2026-07-01T10:00:00Z"), // never returned
      row("reading_completed", "c", "2026-07-19T22:00:00Z"), // too young: excluded
    ];
    const d1 = dayNRetention(rows, 1, ASOF);
    expect(d1.eligible).toBe(2);
    expect(d1.returned).toBe(1);
    expect(d1.rate).toBeCloseTo(0.5);
  });

  it("computes D7: any return within 7 days after the first day", () => {
    const rows = [
      row("reading_completed", "a", "2026-07-01T10:00:00Z"),
      row("reading_completed", "a", "2026-07-06T10:00:00Z"), // within window
      row("reading_completed", "b", "2026-07-01T10:00:00Z"),
      row("reading_completed", "b", "2026-07-12T10:00:00Z"), // outside D7 window
    ];
    const d7 = dayNRetention(rows, 7, ASOF);
    expect(d7.eligible).toBe(2);
    expect(d7.returned).toBe(1);
  });

  it("counts weekly returning readers: >=2 completed-reading days in rolling 7", () => {
    const rows = [
      row("reading_completed", "a", "2026-07-15T10:00:00Z"),
      row("reading_completed", "a", "2026-07-18T10:00:00Z"), // two days: counts
      row("reading_completed", "b", "2026-07-18T10:00:00Z"),
      row("reading_completed", "b", "2026-07-18T15:00:00Z"), // same day twice: no
      row("reading_completed", "c", "2026-07-01T10:00:00Z"),
      row("reading_completed", "c", "2026-07-03T10:00:00Z"), // outside window
      row("landing_viewed", "d", "2026-07-15T10:00:00Z"),
      row("landing_viewed", "d", "2026-07-18T10:00:00Z"), // visits, not readings
    ];
    expect(weeklyReturningReaders(rows, ASOF)).toBe(1);
  });

  it("counts users with three or more completed readings", () => {
    const rows = [
      row("reading_completed", "a", "2026-07-01T10:00:00Z"),
      row("project_reading_completed", "a", "2026-07-02T10:00:00Z"),
      row("reading_completed", "a", "2026-07-03T10:00:00Z"),
      row("reading_completed", "b", "2026-07-01T10:00:00Z"),
    ];
    expect(multiReadingUsers(rows, 3)).toBe(1);
  });

  it("merges guest history with the account via the shared visitor id", () => {
    const rows = [
      row("reading_completed", "a", "2026-07-01T10:00:00Z"), // as guest
      row("account_created", "a", "2026-07-01T11:00:00Z", "user-1"),
      row("reading_completed", "a", "2026-07-02T10:00:00Z", "user-1"),
      row("reading_completed", "a", "2026-07-03T10:00:00Z", "user-1"),
    ];
    expect(multiReadingUsers(rows, 3)).toBe(1); // one person, not two
    expect(guestVsAuthed(rows)).toEqual({ guest: 0, authed: 1 });
  });
});

describe("engagement + pro-interest metrics", () => {
  it("computes journal-save rate among readers", () => {
    const rows = [
      row("reading_completed", "a", "2026-07-01T10:00:00Z"),
      row("journal_entry_saved", "a", "2026-07-01T10:05:00Z"),
      row("reading_completed", "b", "2026-07-01T10:00:00Z"),
      row("journal_entry_saved", "c", "2026-07-01T10:00:00Z"), // saver who never read: excluded
    ];
    expect(journalSaveRate(rows)).toBeCloseTo(0.5);
  });

  it("breaks down completed readings by surface", () => {
    const rows = [
      row("reading_completed", "a", "2026-07-01T10:00:00Z", null, { surface: "daily" }),
      row("reading_completed", "a", "2026-07-02T10:00:00Z", null, { surface: "daily" }),
      row("project_reading_completed", "b", "2026-07-01T10:00:00Z", null, { surface: "project-stage" }),
    ];
    expect(readingTypeBreakdown(rows)).toEqual({ daily: 2, "project-stage": 1 });
  });

  it("computes the pro funnel and plan distribution (last selection wins)", () => {
    const rows = [
      row("pro_page_viewed", "a", "2026-07-01T10:00:00Z"),
      row("pro_plan_selected", "a", "2026-07-01T10:01:00Z", null, { plan: "monthly_5" }),
      row("pro_plan_selected", "a", "2026-07-01T10:02:00Z", null, { plan: "annual_39" }),
      row("pro_waitlist_started", "a", "2026-07-01T10:03:00Z"),
      row("pro_waitlist_joined", "a", "2026-07-01T10:04:00Z"),
      row("pro_page_viewed", "b", "2026-07-01T11:00:00Z"),
    ];
    const funnel = proFunnel(rows);
    expect(funnel.viewers).toBe(2);
    expect(funnel.waitlistJoiners).toBe(1);
    expect(funnel.planSelectionRate).toBeCloseTo(0.5);
    expect(funnel.waitlistJoinRate).toBeCloseTo(0.5);
    expect(planPreferenceDistribution(rows)).toEqual({ annual_39: 1 });
  });

  it("never references identities outside the provided rows", () => {
    expect(proFunnel([]).viewers).toBe(0);
    expect(planPreferenceDistribution([])).toEqual({});
  });
});

describe("small-sample warnings", () => {
  it("warns under 30 users and stays quiet at 30+", () => {
    expect(smallSampleWarning(12)).toContain("Only 12 users are included");
    expect(smallSampleWarning(1)).toContain("Only 1 user is included");
    expect(smallSampleWarning(30)).toBeNull();
  });
});
