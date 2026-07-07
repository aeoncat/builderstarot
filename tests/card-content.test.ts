import { describe, expect, it } from "vitest";

import {
  CARD_CONTENTS,
  CARD_CONTENT_BY_SLUG,
  CARD_SLUG_BY_NAME,
  type CardContent,
  getCardContentByName,
  orientationContent,
} from "@/lib/card-content";
import { DECK_EXPRESSION_EXEMPTIONS, validateCardContent, validateDeckContent } from "@/lib/card-content-validation";
import { CURRENT_DECK_CARD_NAMES } from "@/lib/card-deck";

describe("card content registry", () => {
  it("passes deck validation with no errors", () => {
    expect(validateDeckContent(CARD_CONTENTS)).toEqual([]);
  });

  it("only contains names that exist in the live deck (card-deck.ts)", () => {
    for (const card of CARD_CONTENTS) {
      expect(CURRENT_DECK_CARD_NAMES).toContain(card.name);
    }
  });

  it("covers every card in CURRENT_DECK_CARD_NAMES exactly once", () => {
    const contentNames = CARD_CONTENTS.map((card) => card.name).sort();
    expect(contentNames).toEqual([...CURRENT_DECK_CARD_NAMES].sort());
    expect(CARD_CONTENTS).toHaveLength(CURRENT_DECK_CARD_NAMES.length);
  });

  it("derives consistent lookup maps from the authoring array", () => {
    expect(Object.keys(CARD_CONTENT_BY_SLUG)).toHaveLength(CARD_CONTENTS.length);
    expect(Object.keys(CARD_SLUG_BY_NAME)).toHaveLength(CARD_CONTENTS.length);

    for (const card of CARD_CONTENTS) {
      expect(CARD_CONTENT_BY_SLUG[card.slug]).toBe(card);
      expect(CARD_SLUG_BY_NAME[card.name]).toBe(card.slug);
      expect(getCardContentByName(card.name)).toBe(card);
    }
  });

  it("returns null for unknown or legacy card names", () => {
    expect(getCardContentByName("Definitely Not A Card")).toBeNull();
  });

  it("selects orientation content symmetrically", () => {
    const sprint = CARD_CONTENT_BY_SLUG["the-sprint"];
    expect(orientationContent(sprint, "UPRIGHT")).toBe(sprint.upright);
    expect(orientationContent(sprint, "REVERSED")).toBe(sprint.reversed);
  });

  it("gives every card orientation-specific reflection questions", () => {
    for (const card of CARD_CONTENTS) {
      expect(card.upright.questions[0]).not.toBe(card.reversed.questions[0]);
    }
  });
});

describe("content validation utilities", () => {
  const validCard = CARD_CONTENT_BY_SLUG["the-pause"];

  function withUpright(overrides: Partial<CardContent["upright"]>): CardContent {
    return { ...validCard, upright: { ...validCard.upright, ...overrides } };
  }

  it("accepts a known-good card", () => {
    expect(validateCardContent(validCard)).toEqual([]);
  });

  it("rejects shallow meanings", () => {
    const errors = validateCardContent(withUpright({ meaning: "Too short." }));
    expect(errors.some((error) => error.includes("too shallow"))).toBe(true);
  });

  it("rejects tension clauses that start uppercase", () => {
    const errors = validateCardContent(withUpright({ tension: "Believing the work needs more" }));
    expect(errors.some((error) => error.includes("tension"))).toBe(true);
  });

  it("rejects warnings that cannot complete an 'if nothing changes' framing", () => {
    const errors = validateCardContent(withUpright({ warning: "You will regret it." }));
    expect(errors.some((error) => error.includes("warning"))).toBe(true);
  });

  it("rejects questions that do not end with a question mark", () => {
    const errors = validateCardContent(withUpright({ questions: ["What now."] }));
    expect(errors.some((error) => error.includes("question"))).toBe(true);
  });

  it("rejects duplicate jurisdiction keys across the deck", () => {
    const clone: CardContent = { ...validCard, slug: "the-pause-clone", name: "The Pause Clone", classical: { name: "The Hermit", numeral: 9 } };
    const errors = validateDeckContent([validCard, clone]);
    expect(errors.some((error) => error.includes("jurisdictionKey"))).toBe(true);
  });

  it("rejects duplicate classical numerals across the deck", () => {
    const clone: CardContent = {
      ...validCard,
      slug: "the-pause-clone",
      name: "The Pause Clone",
      jurisdictionKey: "something-else",
    };
    const errors = validateDeckContent([validCard, clone]);
    expect(errors.some((error) => error.includes("classical numeral"))).toBe(true);
  });

  it("keeps every expression exemption pointed at a real, documented card", () => {
    const slugs = new Set<string>(CARD_CONTENTS.map((card) => card.slug));
    DECK_EXPRESSION_EXEMPTIONS.forEach((rationale, slug) => {
      expect(slugs.has(slug), `exemption "${slug}" does not match any card`).toBe(true);
      expect(rationale.trim().length, `exemption "${slug}" needs a rationale`).toBeGreaterThan(0);
    });
  });

  it("validates the live deck using the documented exemption set by default", () => {
    // No options passed: falls back to DECK_EXPRESSION_EXEMPTIONS.
    expect(validateDeckContent(CARD_CONTENTS)).toEqual([]);
  });

  it("flags shared expression tags unless explicitly exempted", () => {
    const shared: CardContent = {
      ...validCard,
      reversed: { ...validCard.reversed, tags: { ...validCard.reversed.tags, expression: validCard.upright.tags.expression } },
    };
    expect(validateDeckContent([shared]).some((error) => error.includes("expression"))).toBe(true);
    expect(
      validateDeckContent([shared], { allowSharedExpression: new Set([shared.slug]) }).some((error) =>
        error.includes("expression"),
      ),
    ).toBe(false);
  });
});
