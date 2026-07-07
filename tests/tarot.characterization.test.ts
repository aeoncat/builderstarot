/**
 * Targeted characterization tests for the current draw/orientation logic,
 * pinned before Phase 2 changes any reading behavior.
 */

import type { Card } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { meaningForOrientation } from "@/lib/serializers";
import { drawCards, getDeterministicDaily, pickOrientation } from "@/lib/tarot";

function makeCard(id: string): Card {
  return {
    id,
    name: `Card ${id}`,
    arcana: "MAJOR",
    suit: null,
    rank: null,
    keywords: "[]",
    uprightMeaning: `upright-${id}`,
    reversedMeaning: `reversed-${id}`,
    promptQuestions: "[]",
    imageUrl: null,
    createdAt: new Date(0),
  };
}

const deck = Array.from({ length: 22 }, (_, i) => makeCard(String(i)));

describe("pickOrientation", () => {
  it("returns UPRIGHT at 0% and REVERSED at 100% regardless of seed", () => {
    expect(pickOrientation(0, "any-seed")).toBe("UPRIGHT");
    expect(pickOrientation(100, "any-seed")).toBe("REVERSED");
    expect(pickOrientation(0)).toBe("UPRIGHT");
    expect(pickOrientation(100)).toBe("REVERSED");
  });

  it("is deterministic for the same seed", () => {
    for (const seed of ["a", "user:2026-07-07:orientation", "z"]) {
      expect(pickOrientation(30, seed)).toBe(pickOrientation(30, seed));
    }
  });
});

describe("getDeterministicDaily", () => {
  it("returns the same card and orientation for the same seed", () => {
    const a = getDeterministicDaily(deck, "user-1:2026-07-07", 30);
    const b = getDeterministicDaily(deck, "user-1:2026-07-07", 30);
    expect(a.card.id).toBe(b.card.id);
    expect(a.orientation).toBe(b.orientation);
  });

  it("varies by seed", () => {
    const picks = new Set(
      ["u1:d1", "u2:d1", "u1:d2", "u3:d5", "u4:d9"].map((seed) => getDeterministicDaily(deck, seed, 0).card.id),
    );
    expect(picks.size).toBeGreaterThan(1);
  });
});

describe("drawCards", () => {
  it("draws the requested count without duplicates", () => {
    const picked = drawCards(deck, 5, 30);
    expect(picked).toHaveLength(5);
    expect(new Set(picked.map((item) => item.card.id)).size).toBe(5);
  });

  it("never exceeds the pool size", () => {
    expect(drawCards(deck.slice(0, 2), 5, 0)).toHaveLength(2);
  });

  it("returns all-upright when reversedChance is 0", () => {
    for (const item of drawCards(deck, 10, 0)) {
      expect(item.orientation).toBe("UPRIGHT");
    }
  });
});

describe("meaningForOrientation", () => {
  it("selects by orientation", () => {
    expect(meaningForOrientation("up", "rev", "UPRIGHT")).toBe("up");
    expect(meaningForOrientation("up", "rev", "REVERSED")).toBe("rev");
  });
});
