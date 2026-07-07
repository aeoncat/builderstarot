import { describe, expect, it } from "vitest";

import { CARD_CONTENTS, CARD_CONTENT_BY_SLUG, orientationContent } from "@/lib/card-content";
import { extractSubject } from "@/lib/context-extract";
import {
  LEGACY_ACTION_FRAME_ID,
  LEGACY_FRAME_ID,
  buildFrameInput,
  chooseQuestionIndex,
  interpretCard,
  interpretDrawnCard,
} from "@/lib/interpret";
import { POSITION_ROLES, ROLE_EMPHASIS } from "@/lib/position-roles";
import type { OrientationType } from "@/lib/types";

const ORIENTATIONS: OrientationType[] = ["UPRIGHT", "REVERSED"];

const CERTAINTY_PATTERNS = [
  /\bwill certainly\b/i,
  /\bdestined\b/i,
  /\bfate\b/i,
  /\bguaranteed\b/i,
  /\binevitab/i,
  /\bpredict(s|ed|ion)?\s+that\b/i,
];

function assertCleanProse(text: string, label: string) {
  expect(text.trim().length, `${label}: empty output`).toBeGreaterThan(0);
  expect(text, `${label}: raw placeholder`).not.toMatch(/undefined|null|\$\{|\{\{|\[object/);
  expect(text, `${label}: double space`).not.toContain("  ");
  expect(text, `${label}: doubled punctuation`).not.toMatch(/\.\.|,,|;;|\?\.|\.\?|:\./);
  expect(text, `${label}: must start uppercase`).toMatch(/^[A-Z]/);
  expect(text, `${label}: must end with terminal punctuation`).toMatch(/[.?!]$/);
  expect(text, `${label}: legacy grammar pattern`).not.toContain("points toward");
}

describe("cross-product: every card x orientation x role x frame", () => {
  // 22 cards x 2 orientations x 11 roles x every frame in that role's pool.
  for (const card of CARD_CONTENTS) {
    for (const orientation of ORIENTATIONS) {
      for (const role of POSITION_ROLES) {
        const emphasis = ROLE_EMPHASIS[role];
        for (const frame of emphasis.frames) {
          it(`${card.slug} ${orientation} ${role} ${frame.id}`, () => {
            const content = orientationContent(card, orientation);
            const question = content.questions[0];
            const input = buildFrameInput(card, content, role, "Test Position", "this project", question);
            const rendered = frame.render(input);

            assertCleanProse(rendered, `${card.slug}/${orientation}/${role}/${frame.id}`);

            // Card identity or its territory must anchor the text.
            expect(rendered.includes(card.name) || rendered.includes(card.jurisdiction)).toBe(true);
            // Selected content must actually appear (primary or secondary emphasis).
            expect(rendered.includes(input.primaryText) || rendered.includes(input.secondaryText)).toBe(true);

            if (role === "trajectory") {
              for (const pattern of CERTAINTY_PATTERNS) {
                expect(rendered, `trajectory certainty language: ${pattern}`).not.toMatch(pattern);
              }
              expect(rendered).toMatch(/if nothing changes|current heading/i);
            }
          });
        }
      }
    }
  }
});

describe("interpretCard engine", () => {
  const sprint = CARD_CONTENT_BY_SLUG["the-sprint"];
  const base = {
    card: sprint,
    orientation: "UPRIGHT" as const,
    role: "advice" as const,
    positionLabel: "The Plan",
    seed: "stable-seed",
  };

  it("is deterministic: same inputs, same output", () => {
    expect(interpretCard(base)).toEqual(interpretCard(base));
  });

  it("returns valid frame ids and clean prose for every card/orientation/role", () => {
    const validFrameIds = new Set(Object.values(ROLE_EMPHASIS).flatMap((e) => e.frames.map((f) => f.id)));
    for (const card of CARD_CONTENTS) {
      for (const orientation of ORIENTATIONS) {
        for (const role of POSITION_ROLES) {
          const result = interpretCard({ card, orientation, role, positionLabel: "P", seed: `${card.slug}:${role}` });
          expect(validFrameIds.has(result.frameId)).toBe(true);
          expect(result.actionFrameId).toMatch(/^action-/);
          assertCleanProse(result.interpretation, `${card.slug}/${orientation}/${role} interpretation`);
          assertCleanProse(result.nextAction, `${card.slug}/${orientation}/${role} action`);
          if (result.reflectionQuestion) {
            expect(result.reflectionQuestion.endsWith("?")).toBe(true);
            // The reflection question must not repeat inside the interpretation.
            expect(result.interpretation).not.toContain(result.reflectionQuestion);
          }
        }
      }
    }
  });

  it("uses reversed content for reversed draws", () => {
    const upright = interpretCard({ ...base, role: "problem" });
    const reversed = interpretCard({ ...base, role: "problem", orientation: "REVERSED" });
    expect(reversed.interpretation).toContain(sprint.reversed.tension);
    expect(reversed.interpretation).not.toContain(sprint.upright.tension);
    expect(upright.interpretation).toContain(sprint.upright.tension);
  });

  it("changes interpretation when the same card lands in a different role", () => {
    const asAdvice = interpretCard({ ...base, role: "advice" });
    const asBlocker = interpretCard({ ...base, role: "blocker" });
    expect(asAdvice.interpretation).not.toBe(asBlocker.interpretation);
  });

  it("derives the next action from the card's own advice", () => {
    for (const card of CARD_CONTENTS) {
      const result = interpretCard({ card, orientation: "UPRIGHT", role: "advice", positionLabel: "P", seed: "s" });
      expect(result.nextAction).toContain(card.upright.advice);
    }
  });

  it("produces distinct actions for three different cards in one reading", () => {
    const cards = [CARD_CONTENT_BY_SLUG["the-sprint"], CARD_CONTENT_BY_SLUG["the-pause"], CARD_CONTENT_BY_SLUG["the-outage"]];
    const usedFrameIds = new Set<string>();
    const usedActionFrameIds = new Set<string>();
    const actions = cards.map((card, index) => {
      const result = interpretCard({
        card,
        orientation: "UPRIGHT",
        role: "advice",
        positionLabel: "P",
        seed: `reading:${index}`,
        usedFrameIds,
        usedActionFrameIds,
      });
      usedFrameIds.add(result.frameId);
      usedActionFrameIds.add(result.actionFrameId);
      return result.nextAction;
    });
    expect(new Set(actions).size).toBe(3);
  });

  it("varies interpretation frames across a reading when alternatives exist", () => {
    const cards = [CARD_CONTENT_BY_SLUG["the-builder"], CARD_CONTENT_BY_SLUG["the-fog"], CARD_CONTENT_BY_SLUG["the-mentor"]];
    const usedFrameIds = new Set<string>();
    const frameIds = cards.map((card, index) => {
      const result = interpretCard({
        card,
        orientation: "UPRIGHT",
        role: "resource",
        positionLabel: "P",
        seed: `spread:${index}`,
        usedFrameIds,
      });
      usedFrameIds.add(result.frameId);
      return result.frameId;
    });
    expect(new Set(frameIds).size).toBeGreaterThan(1);
  });

  it("can deterministically select either reflection question", () => {
    const content = sprint.upright;
    expect(content.questions.length).toBe(2);
    const seen = new Set<number>();
    for (let i = 0; i < 40 && seen.size < 2; i += 1) {
      seen.add(chooseQuestionIndex(content, `seed-${i}`));
    }
    expect(seen).toEqual(new Set([0, 1]));
    // And selection is stable for a fixed seed.
    expect(chooseQuestionIndex(content, "fixed")).toBe(chooseQuestionIndex(content, "fixed"));
  });
});

describe("context handling", () => {
  it("extracts a plain product type without quoting the context", () => {
    const subject = extractSubject({
      context: "I'm building a small habit tracker and I'm not sure what belongs in the first version.",
    });
    expect(subject).toBe("your habit tracker");
  });

  it("does not match keywords inside other words", () => {
    expect(extractSubject({ context: "whatever happens, happens" })).toBe("this project");
  });

  it("uses a short project name when no product type is found", () => {
    expect(extractSubject({ context: "something unusual", projectName: "Nightjar" })).toBe("Nightjar");
  });

  it("refuses sentence-like project names", () => {
    expect(extractSubject({ projectName: "My plan is to launch this by June!" })).toBe("this project");
  });

  it("falls back to the stage subject, then the generic subject", () => {
    expect(extractSubject({ stage: "launch-prep" })).toBe("the launch");
    expect(extractSubject({})).toBe("this project");
  });

  it("produces a clean reading with no context at all", () => {
    const result = interpretCard({
      card: CARD_CONTENT_BY_SLUG["the-fog"],
      orientation: "UPRIGHT",
      role: "problem",
      positionLabel: "The Drain",
      seed: "no-context",
    });
    assertCleanProse(result.interpretation, "no-context interpretation");
    expect(result.interpretation).not.toContain("undefined");
  });

  it("never quotes the raw context into the output", () => {
    const context = "I am building a weird SaaS for llama groomers and I feel lost about pricing.";
    const result = interpretCard({
      card: CARD_CONTENT_BY_SLUG["the-signal"],
      orientation: "UPRIGHT",
      role: "resource",
      positionLabel: "The Value",
      context,
      seed: "ctx",
    });
    expect(result.interpretation).not.toContain("llama groomers");
    expect(result.interpretation).not.toContain(context);
  });
});

describe("legacy fallback", () => {
  const legacyCard = {
    name: "The Old Relic",
    uprightMeaning: "A legacy upright meaning.",
    reversedMeaning: "A legacy reversed meaning.",
    promptQuestions: ["What endures?"],
  };

  it("falls back to stored meanings for cards without registry content", () => {
    const result = interpretDrawnCard({
      card: legacyCard,
      orientation: "REVERSED",
      role: "insight",
      positionLabel: "Insight",
      seed: "legacy",
    });
    expect(result.hasRichContent).toBe(false);
    expect(result.interpretation).toBe("A legacy reversed meaning.");
    expect(result.nextAction).toBe("");
    expect(result.reflectionQuestion).toBe("What endures?");
    expect(result.frameId).toBe(LEGACY_FRAME_ID);
    expect(result.actionFrameId).toBe(LEGACY_ACTION_FRAME_ID);
  });

  it("routes registry cards through the full engine", () => {
    const result = interpretDrawnCard({
      card: {
        name: "The Sprint",
        uprightMeaning: "stale db text",
        reversedMeaning: "stale db text",
        promptQuestions: [],
      },
      orientation: "UPRIGHT",
      role: "advice",
      positionLabel: "Ship",
      seed: "rich",
    });
    expect(result.hasRichContent).toBe(true);
    expect(result.interpretation).not.toContain("stale db text");
    expect(result.nextAction).toContain(CARD_CONTENT_BY_SLUG["the-sprint"].upright.advice);
  });
});
