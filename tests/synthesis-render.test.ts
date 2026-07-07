import { describe, expect, it } from "vitest";

import { CARD_CONTENTS, CARD_CONTENT_BY_SLUG, type CardSlug } from "@/lib/card-content";
import { interpretCard } from "@/lib/interpret";
import { POSITION_ROLES, type PositionRole } from "@/lib/position-roles";
import { synthesizeReading, type SynthesisCardInput } from "@/lib/synthesis";
import type { OrientationType } from "@/lib/types";

const PREDICTION_PATTERNS = [
  /\bguaranteed\b/i,
  /\bdestined\b/i,
  /\bpreordained\b/i,
  /\binevitabl/i,
  /\bfate\b/i,
  /\bwill (?:definitely|surely|certainly|always|never)\b/i,
  /\bno matter what\b/i,
];

type Spec = { slug: CardSlug; role: PositionRole; orientation?: OrientationType; label?: string };

function toInputs(specs: Spec[]): SynthesisCardInput[] {
  return specs.map((spec, index) => {
    const card = CARD_CONTENT_BY_SLUG[spec.slug];
    const orientation = spec.orientation ?? "UPRIGHT";
    const reading = interpretCard({
      card,
      orientation,
      role: spec.role,
      positionLabel: spec.label ?? spec.role,
      seed: `${spec.slug}:${index}:${orientation}`,
    });
    return {
      cardId: spec.slug,
      name: card.name,
      orientation,
      role: spec.role,
      positionLabel: spec.label ?? spec.role,
      nextAction: reading.nextAction,
    };
  });
}

function synth(specs: Spec[], subject = "this project", seed = "s") {
  return synthesizeReading({ cards: toInputs(specs), spreadType: "test", subject, seed })!;
}

function assertCleanSynthesis(text: string, label: string) {
  expect(text.trim().length, `${label}: empty`).toBeGreaterThan(0);
  expect(text, `${label}: placeholder`).not.toMatch(/undefined|null|\$\{|\{\{|\[object/);
  expect(text, `${label}: double space`).not.toContain("  ");
  for (const pattern of PREDICTION_PATTERNS) {
    expect(text, `${label}: prediction language ${pattern}`).not.toMatch(pattern);
  }
}

describe("synthesis is gated to multi-card readings", () => {
  it("returns null for a single-card reading", () => {
    expect(synthesizeReading({ cards: toInputs([{ slug: "the-sprint", role: "insight" }]), spreadType: "single", subject: "x", seed: "s" })).toBeNull();
  });

  it("returns null for a daily (one-card) reading", () => {
    const daily = toInputs([{ slug: "the-fog", role: "insight", label: "Daily Insight" }]);
    expect(synthesizeReading({ cards: daily, spreadType: "daily", subject: "x", seed: "s" })).toBeNull();
  });

  it("produces synthesis for two or more cards", () => {
    expect(synth([{ slug: "the-sprint", role: "advice" }, { slug: "the-pause", role: "blocker" }])).not.toBeNull();
  });
});

describe("rendering basics", () => {
  const example = synth([
    { slug: "the-fog", role: "problem", label: "The Drain" },
    { slug: "the-signal", role: "resource", label: "The Value" },
    { slug: "the-sprint", role: "advice", label: "The Ask" },
  ], "your habit tracker");

  it("is deterministic", () => {
    const a = synth([{ slug: "the-outage", role: "problem" }, { slug: "the-iteration", role: "advice" }], "this project", "seed-1");
    const b = synth([{ slug: "the-outage", role: "problem" }, { slug: "the-iteration", role: "advice" }], "this project", "seed-1");
    expect(a.synthesis).toEqual(b.synthesis);
  });

  it("produces a non-empty, clean headline and summary", () => {
    assertCleanSynthesis(example.synthesis.headline, "headline");
    assertCleanSynthesis(example.synthesis.summary, "summary");
  });

  it("keeps the headline to roughly 3-8 words and not just card names", () => {
    const words = example.synthesis.headline.split(/\s+/);
    expect(words.length).toBeGreaterThanOrEqual(2);
    expect(words.length).toBeLessThanOrEqual(8);
  });

  it("renders no more than one primary and two supporting patterns", () => {
    expect(example.synthesis.supportingPatterns.length).toBeLessThanOrEqual(2);
  });

  it("keeps a three-card summary within a reasonable length", () => {
    const words = example.synthesis.summary.split(/\s+/).length;
    expect(words).toBeGreaterThanOrEqual(40);
    expect(words).toBeLessThanOrEqual(170);
  });
});

describe("priority action integrity", () => {
  it("exactly matches an existing card's next action and cites a valid source", () => {
    const specs: Spec[] = [
      { slug: "the-outage", role: "cause", label: "Past" },
      { slug: "the-reckoning", role: "lesson", label: "Lesson" },
      { slug: "the-iteration", role: "advice", label: "Advice" },
    ];
    const inputs = toInputs(specs);
    const result = synthesizeReading({ cards: inputs, spreadType: "test", subject: "this project", seed: "s" })!;
    const { priorityAction, priorityActionSource } = result.synthesis;
    expect(priorityAction).toBeDefined();
    const match = inputs.find((card) => card.nextAction === priorityAction);
    expect(match, "priority action must be a verbatim card action").toBeDefined();
    expect(priorityActionSource!.cardSlug).toBe(match!.cardId);
    expect(priorityActionSource!.positionRole).toBe(match!.role);
  });

  it("omits the priority action when the spread has no actionable card", () => {
    const result = synth([
      { slug: "the-legacy", role: "insight" },
      { slug: "the-north-star", role: "lesson" },
    ]);
    expect(result.synthesis.priorityAction).toBeUndefined();
  });
});

describe("generated coverage across many spreads", () => {
  const slugs = CARD_CONTENTS.map((card) => card.slug);
  const orientations: OrientationType[] = ["UPRIGHT", "REVERSED"];

  function sampleSpec(n: number, size: 3 | 5): Spec[] {
    const specs: Spec[] = [];
    for (let i = 0; i < size; i += 1) {
      const slug = slugs[(n * 7 + i * 13) % slugs.length];
      const role = POSITION_ROLES[(n * 3 + i * 5) % POSITION_ROLES.length];
      const orientation = orientations[(n + i) % 2];
      specs.push({ slug, role, orientation, label: `P${i}` });
    }
    return specs;
  }

  it("holds invariants across 300 three-card and 200 five-card spreads", () => {
    const headlines = new Set<string>();
    for (let n = 0; n < 500; n += 1) {
      const size: 3 | 5 = n < 300 ? 3 : 5;
      const specs = sampleSpec(n, size);
      const inputs = toInputs(specs);
      const result = synthesizeReading({ cards: inputs, spreadType: "test", subject: "this project", seed: `gen:${n}` });
      expect(result, `spread ${n} should synthesize`).not.toBeNull();
      const { synthesis, analysis } = result!;

      assertCleanSynthesis(synthesis.headline, `spread ${n} headline`);
      assertCleanSynthesis(synthesis.summary, `spread ${n} summary`);
      expect(synthesis.supportingPatterns.length).toBeLessThanOrEqual(2);

      // Priority action, when present, is a verbatim card action.
      if (synthesis.priorityAction) {
        expect(inputs.some((card) => card.nextAction === synthesis.priorityAction)).toBe(true);
      }
      // No pattern references an out-of-range card.
      for (const pattern of analysis.patterns) {
        for (const index of pattern.cardIndices) {
          expect(index).toBeLessThan(specs.length);
        }
      }
      headlines.add(synthesis.headline);
    }
    // Headlines should not collapse to a single string across 500 spreads.
    expect(headlines.size).toBeGreaterThan(6);
  });
});
