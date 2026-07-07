import { describe, expect, it } from "vitest";

import { CARD_CONTENT_BY_SLUG, type CardSlug } from "@/lib/card-content";
import type { PositionRole } from "@/lib/position-roles";
import { analyzeSpread, type SpreadCardFact } from "@/lib/synthesis-analyze";
import { buildSpreadFacts, type SynthesisCardInput } from "@/lib/synthesis";
import type { OrientationType } from "@/lib/types";

type Spec = { slug: CardSlug; role: PositionRole; orientation?: OrientationType; label?: string };

function inputs(specs: Spec[]): SynthesisCardInput[] {
  return specs.map((spec) => ({
    cardId: spec.slug,
    name: CARD_CONTENT_BY_SLUG[spec.slug].name,
    orientation: spec.orientation ?? "UPRIGHT",
    role: spec.role,
    positionLabel: spec.label ?? spec.role,
    nextAction: `action-for-${spec.slug}`,
  }));
}

function analyze(specs: Spec[]) {
  return analyzeSpread({ cards: buildSpreadFacts(inputs(specs)), spreadType: "test", subject: "this project" });
}

describe("analyzeSpread determinism & referential integrity", () => {
  const specs: Spec[] = [
    { slug: "the-outage", role: "problem" },
    { slug: "the-reckoning", role: "lesson" },
    { slug: "the-iteration", role: "advice" },
  ];

  it("produces the same facts for the same spread", () => {
    expect(analyze(specs)).toEqual(analyze(specs));
  });

  it("never references a card index outside the spread", () => {
    const analysis = analyze(specs);
    for (const pattern of analysis.patterns) {
      for (const index of pattern.cardIndices) {
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(specs.length);
      }
    }
  });

  it("selects at most one primary and two supporting patterns", () => {
    const analysis = analyze(specs);
    expect(analysis.supporting.length).toBeLessThanOrEqual(2);
    if (analysis.primary) expect(analysis.primary.supportingOnly).not.toBe(true);
  });
});

describe("position changes the detected relationship", () => {
  it("Pause blocker + Sprint advice reads as diagnosis-remedy", () => {
    const analysis = analyze([
      { slug: "the-pause", role: "blocker" },
      { slug: "the-sprint", role: "advice" },
    ]);
    expect(analysis.primary?.kind).toBe("diagnosis-remedy");
  });

  it("the same two cards as two prescriptive roles read as tension", () => {
    const analysis = analyze([
      { slug: "the-pause", role: "advice" },
      { slug: "the-sprint", role: "lever" },
    ]);
    expect(analysis.primary?.kind).toBe("tension");
    expect(analysis.primary?.detail?.bothPrescriptive).toBe("true");
  });
});

describe("shared tags alone do not create reinforcement", () => {
  it("identical tags across categories with no shared theme is not reinforcement", () => {
    // The Outage and The Standard both carry hold/work/assess but have unrelated
    // jurisdictions; one diagnostic, one prescriptive.
    const outage = CARD_CONTENT_BY_SLUG["the-outage"].upright.tags;
    const standard = CARD_CONTENT_BY_SLUG["the-standard"].upright.tags;
    expect(outage.energy).toBe(standard.energy);
    expect(outage.function).toBe(standard.function);

    const analysis = analyze([
      { slug: "the-outage", role: "problem" },
      { slug: "the-standard", role: "advice" },
    ]);
    const reinforcement = analysis.patterns.find((pattern) => pattern.kind === "reinforcement");
    expect(reinforcement).toBeUndefined();
  });
});

describe("diagnostic vs prescriptive agreement", () => {
  it("labels two diagnostic cards as diagnostic agreement", () => {
    const analysis = analyze([
      { slug: "the-fog", role: "problem" },
      { slug: "the-signal", role: "cause" },
    ]);
    const reinforcement = analysis.patterns.find((pattern) => pattern.kind === "reinforcement");
    expect(reinforcement?.detail?.agreementType).toBe("diagnostic-agreement");
  });

  it("labels two prescriptive cards as shared counsel", () => {
    const analysis = analyze([
      { slug: "the-builder", role: "advice" },
      { slug: "the-spark", role: "lever" },
    ]);
    const reinforcement = analysis.patterns.find((pattern) => pattern.kind === "reinforcement");
    expect(reinforcement?.detail?.agreementType).toBe("shared-counsel");
  });
});

describe("diagnosis-remedy detection", () => {
  it("detects a diagnostic problem answered by a prescriptive remedy", () => {
    const analysis = analyze([
      { slug: "the-outage", role: "cause" },
      { slug: "the-iteration", role: "advice" },
    ]);
    const dr = analysis.patterns.find((pattern) => pattern.kind === "diagnosis-remedy");
    expect(dr).toBeDefined();
    expect(dr?.diagnosticIndices).toContain(0);
    expect(dr?.remedyIndices).toContain(1);
  });
});

describe("tension detection via opposition rules", () => {
  it("two prescriptive cards with opposing energy produce strong tension", () => {
    const analysis = analyze([
      { slug: "the-sprint", role: "advice" }, // push
      { slug: "the-pause", role: "advice" }, // hold
    ]);
    const tension = analysis.patterns.find((pattern) => pattern.kind === "tension");
    expect(tension).toBeDefined();
    expect(tension!.confidence).toBeGreaterThanOrEqual(0.7);
    expect(analysis.primary?.kind).toBe("tension");
  });

  it("does not manufacture tension between two same-energy cards", () => {
    const analysis = analyze([
      { slug: "the-sprint", role: "advice" }, // push
      { slug: "the-builder", role: "advice" }, // push
    ]);
    expect(analysis.patterns.find((pattern) => pattern.kind === "tension")).toBeUndefined();
  });

  it("keeps a diagnostic+prescriptive opposition weak so diagnosis-remedy wins", () => {
    const analysis = analyze([
      { slug: "the-sprint", role: "advice" }, // push, prescriptive
      { slug: "the-pause", role: "blocker" }, // hold, diagnostic
    ]);
    const tension = analysis.patterns.find((pattern) => pattern.kind === "tension");
    expect(tension!.confidence).toBeLessThan(0.5);
    expect(analysis.primary?.kind).toBe("diagnosis-remedy");
  });
});

describe("progression detection", () => {
  it("detects a diagnostic -> reflective -> prescriptive arc in order", () => {
    const analysis = analyze([
      { slug: "the-outage", role: "problem" },
      { slug: "the-reckoning", role: "lesson" },
      { slug: "the-iteration", role: "advice" },
    ]);
    expect(analysis.patterns.find((pattern) => pattern.kind === "progression")).toBeDefined();
  });

  it("does not detect progression when all positions share a category", () => {
    const analysis = analyze([
      { slug: "the-outage", role: "problem" },
      { slug: "the-fog", role: "cause" },
      { slug: "the-trap", role: "blocker" },
    ]);
    expect(analysis.patterns.find((pattern) => pattern.kind === "progression")).toBeUndefined();
  });

  it("does not detect progression when order breaks the arc", () => {
    const analysis = analyze([
      { slug: "the-iteration", role: "advice" }, // prescriptive first
      { slug: "the-reckoning", role: "lesson" },
      { slug: "the-outage", role: "problem" },
    ]);
    expect(analysis.patterns.find((pattern) => pattern.kind === "progression")).toBeUndefined();
  });
});

describe("focus concentration is supporting only", () => {
  it("marks focus concentration supportingOnly and never primary", () => {
    const analysis = analyze([
      { slug: "the-fog", role: "problem" },
      { slug: "the-signal", role: "cause" },
    ]);
    const focus = analysis.patterns.find((pattern) => pattern.kind === "focus-concentration");
    expect(focus?.supportingOnly).toBe(true);
    expect(analysis.primary?.kind).not.toBe("focus-concentration");
  });
});

describe("neutral fallback", () => {
  it("returns no primary when nothing crosses the confidence threshold", () => {
    const analysis = analyze([
      { slug: "the-legacy", role: "insight" },
      { slug: "the-north-star", role: "insight" },
    ]);
    expect(analysis.primary).toBeNull();
  });
});

describe("legacy cards degrade safely", () => {
  const legacyFacts: SpreadCardFact[] = [
    {
      index: 0,
      name: "The Old Relic",
      slug: null,
      jurisdiction: null,
      jurisdictionKey: null,
      orientation: "UPRIGHT",
      role: "problem",
      category: "diagnostic",
      positionLabel: "Problem",
      tags: null,
      register: null,
      nextAction: "",
      hasRichContent: false,
    },
    {
      index: 1,
      name: CARD_CONTENT_BY_SLUG["the-sprint"].name,
      slug: "the-sprint",
      jurisdiction: CARD_CONTENT_BY_SLUG["the-sprint"].jurisdiction,
      jurisdictionKey: CARD_CONTENT_BY_SLUG["the-sprint"].jurisdictionKey,
      orientation: "UPRIGHT",
      role: "advice",
      category: "prescriptive",
      positionLabel: "Advice",
      tags: CARD_CONTENT_BY_SLUG["the-sprint"].upright.tags,
      register: CARD_CONTENT_BY_SLUG["the-sprint"].upright.register,
      nextAction: "do the sprint thing",
      hasRichContent: true,
    },
  ];

  it("analyzes a spread containing a legacy card without crashing", () => {
    const analysis = analyzeSpread({ cards: legacyFacts, spreadType: "test", subject: "this project" });
    // Structural diagnosis-remedy can still fire off role categories.
    expect(analysis.primary?.kind).toBe("diagnosis-remedy");
    // Tag-based patterns never reference the tag-less legacy card.
    const tagPatterns = analysis.patterns.filter((pattern) =>
      ["reinforcement", "tension", "focus-concentration"].includes(pattern.kind),
    );
    for (const pattern of tagPatterns) {
      expect(pattern.cardIndices).not.toContain(0);
    }
  });
});
