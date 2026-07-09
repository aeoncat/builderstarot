import { describe, expect, it } from "vitest";

import type { KeyValueStore } from "@/lib/analytics/visitor";
import {
  detectReturnVisit,
  getOrCreateVisitorId,
  getReadingCount,
  incrementReadingCount,
  markOnce,
} from "@/lib/analytics/visitor";
import { isOwnerEmail } from "@/lib/owner";
import {
  isEmotionallyDifficultReading,
  isSurveyEligible,
  shouldShowProPrompt,
} from "@/lib/validation/gates";

function memoryStore(initial: Record<string, string> = {}): KeyValueStore & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}

const NOW = new Date("2026-07-20T12:00:00Z");

describe("visitor identity", () => {
  it("creates a stable pseudonymous id and reuses it", () => {
    const store = memoryStore();
    let calls = 0;
    const random = () => {
      calls += 1;
      return `uuid-${calls}-abcdefgh`;
    };
    const first = getOrCreateVisitorId(store, random);
    const second = getOrCreateVisitorId(store, random);
    expect(first).toBe(second);
    expect(calls).toBe(1);
  });

  it("replaces malformed stored ids", () => {
    const store = memoryStore({ bt_vid: "bad id!!" });
    expect(getOrCreateVisitorId(store, () => "fresh-id-12345678")).toBe("fresh-id-12345678");
  });

  it("detects return visits on a later calendar day only", () => {
    const store = memoryStore();
    expect(detectReturnVisit(store, "2026-07-19")).toBe(false); // first ever visit
    expect(detectReturnVisit(store, "2026-07-19")).toBe(false); // same day
    expect(detectReturnVisit(store, "2026-07-20")).toBe(true); // next day
  });

  it("markOnce fires exactly once per key", () => {
    const store = memoryStore();
    expect(markOnce(store, "reading:abc")).toBe(true);
    expect(markOnce(store, "reading:abc")).toBe(false);
    expect(markOnce(store, "reading:def")).toBe(true);
  });

  it("reading counter increments and survives garbage", () => {
    const store = memoryStore({ bt_completed_readings: "not-a-number" });
    expect(getReadingCount(store)).toBe(0);
    expect(incrementReadingCount(store)).toBe(1);
    expect(incrementReadingCount(store)).toBe(2);
    expect(getReadingCount(store)).toBe(2);
  });
});

describe("pro prompt gates", () => {
  const base = { completedReadings: 3, lastShownAt: null, now: NOW };

  it("never prompts before two completed readings", () => {
    expect(shouldShowProPrompt({ ...base, completedReadings: 0 })).toBe(false);
    expect(shouldShowProPrompt({ ...base, completedReadings: 1 })).toBe(false);
    expect(shouldShowProPrompt({ ...base, completedReadings: 2 })).toBe(true);
  });

  it("respects the 7-day cooldown", () => {
    expect(shouldShowProPrompt({ ...base, lastShownAt: "2026-07-18T12:00:00Z" })).toBe(false);
    expect(shouldShowProPrompt({ ...base, lastShownAt: "2026-07-01T12:00:00Z" })).toBe(true);
    expect(shouldShowProPrompt({ ...base, lastShownAt: "garbage-date" })).toBe(true);
  });

  it("suppresses prompts after Burnout/Doubt readings", () => {
    expect(shouldShowProPrompt({ ...base, stage: "burnout-doubt" })).toBe(false);
  });

  it("suppresses prompts after gravity-dominant readings", () => {
    expect(shouldShowProPrompt({ ...base, registers: ["gravity", "gravity", "quiet"] })).toBe(false);
    expect(shouldShowProPrompt({ ...base, registers: ["gravity", "warmth", "quiet"] })).toBe(true);
  });

  it("classifies emotionally difficult readings", () => {
    expect(isEmotionallyDifficultReading("burnout-doubt", undefined)).toBe(true);
    expect(isEmotionallyDifficultReading("mvp-mode", ["gravity", "gravity"])).toBe(true);
    expect(isEmotionallyDifficultReading("mvp-mode", ["jolt", "warmth"])).toBe(false);
    expect(isEmotionallyDifficultReading(null, [])).toBe(false);
  });
});

describe("survey eligibility", () => {
  it("requires auth, three readings, and not-already-answered", () => {
    expect(isSurveyEligible({ isAuthenticated: true, completedReadings: 3, alreadyCompletedOrDismissed: false })).toBe(true);
    expect(isSurveyEligible({ isAuthenticated: false, completedReadings: 5, alreadyCompletedOrDismissed: false })).toBe(false);
    expect(isSurveyEligible({ isAuthenticated: true, completedReadings: 2, alreadyCompletedOrDismissed: false })).toBe(false);
    expect(isSurveyEligible({ isAuthenticated: true, completedReadings: 9, alreadyCompletedOrDismissed: true })).toBe(false);
  });
});

describe("owner authorization", () => {
  it("matches only allowlisted emails, case-insensitively", () => {
    expect(isOwnerEmail("owner@example.com", "owner@example.com")).toBe(true);
    expect(isOwnerEmail("Owner@Example.com", " owner@example.com , second@example.com ")).toBe(true);
    expect(isOwnerEmail("intruder@example.com", "owner@example.com")).toBe(false);
    expect(isOwnerEmail("owner@example.com", undefined)).toBe(false);
    expect(isOwnerEmail(null, "owner@example.com")).toBe(false);
    expect(isOwnerEmail("", "owner@example.com")).toBe(false);
    // Empty allowlist entries never match empty emails.
    expect(isOwnerEmail("  ", ",,")).toBe(false);
  });
});
