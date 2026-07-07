import { describe, expect, it } from "vitest";

import { CARD_CONTENTS } from "@/lib/card-content";
import { SPREADS } from "@/lib/domain";
import {
  GENERIC_POSITION_ROLES,
  POSITION_ROLES,
  ROLE_EMPHASIS,
  type RoleFrameInput,
  chooseFrame,
  emphasisText,
  roleForPositionName,
} from "@/lib/position-roles";
import { PROJECT_STAGES } from "@/lib/projectStages";
import { PROJECT_STAGE_SPREADS } from "@/lib/spreads";

describe("role emphasis coverage", () => {
  it("defines emphasis and at least two frames for every role", () => {
    for (const role of POSITION_ROLES) {
      const emphasis = ROLE_EMPHASIS[role];
      expect(emphasis).toBeDefined();
      expect(emphasis.frames.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("uses globally unique frame ids", () => {
    const ids = Object.values(ROLE_EMPHASIS).flatMap((emphasis) => emphasis.frames.map((frame) => frame.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("renders every frame into clean text for real card content", () => {
    const card = CARD_CONTENTS[0];
    for (const role of POSITION_ROLES) {
      const emphasis = ROLE_EMPHASIS[role];
      const input: RoleFrameInput = {
        cardName: card.name,
        jurisdiction: card.jurisdiction,
        positionLabel: "Test Position",
        subject: "this project",
        primaryText: emphasisText(card.upright, emphasis.primary),
        secondaryText: emphasisText(card.upright, emphasis.secondary),
        question: card.upright.questions[0],
      };
      for (const frame of emphasis.frames) {
        const rendered = frame.render(input);
        expect(rendered.trim().length).toBeGreaterThan(0);
        expect(rendered).not.toContain("undefined");
        expect(rendered).not.toContain("  ");
      }
    }
  });
});

describe("emphasisText", () => {
  const content = CARD_CONTENTS[0].upright;

  it("maps fields to orientation content", () => {
    expect(emphasisText(content, "meaning")).toBe(content.meaning);
    expect(emphasisText(content, "tension")).toBe(content.tension);
    expect(emphasisText(content, "advice")).toBe(content.advice);
    expect(emphasisText(content, "warning")).toBe(content.warning);
    expect(emphasisText(content, "questions")).toBe(content.questions[0]);
  });

  it("selects the requested question index, clamped to the available range", () => {
    expect(emphasisText(content, "questions", 1)).toBe(content.questions[Math.min(1, content.questions.length - 1)]);
    expect(emphasisText(content, "questions", 5)).toBe(content.questions[content.questions.length - 1]);
  });
});

describe("chooseFrame", () => {
  const frames = ROLE_EMPHASIS.advice.frames;

  it("is deterministic for the same seed", () => {
    expect(chooseFrame(frames, "the-sprint:advice:UPRIGHT").id).toBe(chooseFrame(frames, "the-sprint:advice:UPRIGHT").id);
  });

  it("avoids already-used frames when alternatives exist", () => {
    const first = chooseFrame(frames, "seed-a");
    const second = chooseFrame(frames, "seed-a", new Set([first.id]));
    expect(second.id).not.toBe(first.id);
  });

  it("falls back to the full pool when every frame has been used", () => {
    const used = new Set(frames.map((frame) => frame.id));
    expect(() => chooseFrame(frames, "seed-a", used)).not.toThrow();
  });

  it("never renders a multi-card reading through a single frame when others exist", () => {
    const used = new Set<string>();
    const picked: string[] = [];
    for (const slug of ["the-sprint", "the-pause", "the-outage"]) {
      const frame = chooseFrame(frames, `${slug}:advice:UPRIGHT`, used);
      picked.push(frame.id);
      used.add(frame.id);
    }
    expect(new Set(picked).size).toBeGreaterThan(1);
  });
});

describe("position -> role mappings", () => {
  it("gives every generic spread position a valid role", () => {
    for (const spread of Object.values(SPREADS)) {
      for (const position of spread.positions) {
        expect(POSITION_ROLES).toContain(position.role);
        expect(position.label.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("gives every project stage position a valid role", () => {
    for (const stage of PROJECT_STAGES) {
      const spread = PROJECT_STAGE_SPREADS[stage.key];
      expect(spread.positions).toHaveLength(3);
      for (const position of spread.positions) {
        expect(POSITION_ROLES).toContain(position.role);
      }
    }
  });

  it("no project position label collides with a card name", () => {
    const cardNames = new Set<string>(CARD_CONTENTS.map((card) => card.name));
    for (const spread of Object.values(PROJECT_STAGE_SPREADS)) {
      for (const position of spread.positions) {
        expect(cardNames.has(position.label), `position label "${position.label}" collides with a card name`).toBe(false);
      }
    }
  });

  it("maps stored/legacy position names to roles with an insight fallback", () => {
    expect(roleForPositionName("Daily Insight")).toBe("insight");
    expect(roleForPositionName("Outcome")).toBe("trajectory"); // legacy stored label
    expect(roleForPositionName("If Nothing Changes")).toBe("trajectory");
    expect(roleForPositionName("Some Unknown Position")).toBe("insight");
    for (const [name, role] of Object.entries(GENERIC_POSITION_ROLES)) {
      expect(POSITION_ROLES, `role for "${name}"`).toContain(role);
    }
  });
});
