import { describe, expect, it } from "vitest";

import { CURRENT_DECK_CARD_NAMES } from "@/lib/card-deck";
import { DAILY_REVERSED_CHANCE, eligibleDailyCards, selectDailyDraw } from "@/lib/daily";
import { interpretDrawnCard } from "@/lib/interpret";

type TestCard = { id: string; name: string };

const deckCards: TestCard[] = CURRENT_DECK_CARD_NAMES.map((name, index) => ({ id: `deck-${index}`, name }));
const legacyCards: TestCard[] = [
  { id: "legacy-1", name: "The Old Relic" },
  { id: "legacy-2", name: "Retired Card" },
];
const mixed: TestCard[] = [...legacyCards, ...deckCards];

describe("eligibleDailyCards", () => {
  it("makes every current-deck card eligible", () => {
    const eligible = eligibleDailyCards(mixed);
    expect(eligible).toHaveLength(CURRENT_DECK_CARD_NAMES.length);
    expect(new Set(eligible.map((card) => card.name))).toEqual(new Set(CURRENT_DECK_CARD_NAMES));
  });

  it("excludes legacy / retired cards", () => {
    const names = eligibleDailyCards(mixed).map((card) => card.name);
    expect(names).not.toContain("The Old Relic");
    expect(names).not.toContain("Retired Card");
  });

  it("returns cards in a stable canonical order regardless of input order", () => {
    const shuffled = [...mixed].reverse();
    expect(eligibleDailyCards(mixed).map((c) => c.name)).toEqual(eligibleDailyCards(shuffled).map((c) => c.name));
  });
});

describe("selectDailyDraw", () => {
  it("is deterministic for the same identity and date", () => {
    const a = selectDailyDraw(mixed, "user-123:2026-07-07");
    const b = selectDailyDraw(mixed, "user-123:2026-07-07");
    expect(a.card?.id).toBe(b.card?.id);
    expect(a.orientation).toBe(b.orientation);
  });

  it("only ever selects a current-deck card", () => {
    const deckNames = new Set<string>(CURRENT_DECK_CARD_NAMES);
    for (let day = 1; day <= 200; day += 1) {
      const { card } = selectDailyDraw(mixed, `user-x:2026-07-${day}`);
      expect(card).not.toBeNull();
      expect(deckNames.has(card!.name)).toBe(true);
    }
  });

  it("changing the date can produce a different deterministic result", () => {
    const cardNames = new Set<string>();
    const orientations = new Set<string>();
    for (let day = 1; day <= 60; day += 1) {
      const { card, orientation } = selectDailyDraw(mixed, `user-x:2026-08-${day}`);
      cardNames.add(card!.name);
      orientations.add(orientation);
    }
    // Across many dates we should see the card vary and both orientations appear.
    expect(cardNames.size).toBeGreaterThan(1);
    expect(orientations).toEqual(new Set(["UPRIGHT", "REVERSED"]));
  });

  it("different identities on the same date can differ", () => {
    const seeds = ["alice", "bob", "carol", "dave", "erin"].map((id) => selectDailyDraw(mixed, `${id}:2026-07-07`));
    expect(new Set(seeds.map((s) => s.card!.name)).size).toBeGreaterThan(1);
  });

  it("honors the reversed chance bounds", () => {
    expect(selectDailyDraw(mixed, "seed", 0).orientation).toBe("UPRIGHT");
    expect(selectDailyDraw(mixed, "seed", 100).orientation).toBe("REVERSED");
    expect(DAILY_REVERSED_CHANCE).toBe(30);
  });

  it("returns a null card when no eligible cards exist", () => {
    expect(selectDailyDraw(legacyCards, "seed").card).toBeNull();
  });
});

describe("legacy cards still render when directly referenced", () => {
  it("falls back to stored meanings via the interpretation engine", () => {
    // A legacy card that a historical DailyDraw row still points at.
    const result = interpretDrawnCard({
      card: {
        name: "The Old Relic",
        uprightMeaning: "An archived upright meaning.",
        reversedMeaning: "An archived reversed meaning.",
        promptQuestions: ["What remains?"],
      },
      orientation: "UPRIGHT",
      role: "insight",
      positionLabel: "Daily Insight",
      seed: "legacy-daily",
    });
    expect(result.hasRichContent).toBe(false);
    expect(result.interpretation).toBe("An archived upright meaning.");
  });
});
