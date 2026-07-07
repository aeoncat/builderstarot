/**
 * Semantic position roles for spreads.
 *
 * A position's role determines which parts of a card's OrientationContent the
 * interpretation foregrounds, so meaning comes from card x position instead of
 * a hand-written matrix. Frames are small template pools selected
 * deterministically by the interpretation engine (lib/interpret.ts).
 */

import type { OrientationContent } from "@/lib/card-content";
import { hashString } from "@/lib/random";

export const POSITION_ROLES = [
  "problem", // what's wrong
  "cause", // why it's wrong
  "advice", // what to do
  "keep", // what to protect
  "cut", // what to drop or defer
  "blocker", // what stands in the way
  "lever", // what multiplies effort
  "trajectory", // where this heads if nothing changes (extrapolation, not prediction)
  "lesson", // the principle to carry forward
  "resource", // what supports or feeds you
  "insight", // neutral single-card view
] as const;

export type PositionRole = (typeof POSITION_ROLES)[number];

/**
 * Purpose categories used by spread synthesis (Phase 3). A card's role category
 * changes what its raw tags mean: the same card in `blocker` (diagnostic) and
 * `advice` (prescriptive) must not be read the same way.
 *   - diagnostic:   identifies a problem, cost, obstacle, or thing to remove
 *   - prescriptive: identifies what to protect, use, or do
 *   - directional:  describes where the current pattern appears to lead
 *   - reflective:   identifies a principle, perspective, or question
 */
export const ROLE_CATEGORIES = ["diagnostic", "prescriptive", "directional", "reflective"] as const;
export type RoleCategory = (typeof ROLE_CATEGORIES)[number];

export const ROLE_CATEGORY: Record<PositionRole, RoleCategory> = {
  problem: "diagnostic",
  cause: "diagnostic",
  blocker: "diagnostic",
  cut: "diagnostic",
  advice: "prescriptive",
  keep: "prescriptive",
  lever: "prescriptive",
  resource: "prescriptive",
  trajectory: "directional",
  lesson: "reflective",
  insight: "reflective",
};

export function roleCategory(role: PositionRole): RoleCategory {
  return ROLE_CATEGORY[role];
}

export type EmphasisField = "meaning" | "tension" | "advice" | "warning" | "questions";

export type RoleFrameInput = {
  cardName: string;
  jurisdiction: string;
  positionLabel: string;
  /** Short noun phrase for what the reading is about ("your habit tracker",
   *  "the launch", "this project"). Derived from context/stage; never empty. */
  subject: string;
  primaryText: string;
  secondaryText: string;
  question: string;
};

export type RoleFrame = {
  /** Stable id, exposed on rendered interpretations so multi-card readings
   *  can verify frame variety deterministically. */
  readonly id: string;
  /** True when the frame embeds `question` in its rendered text; the engine
   *  then avoids repeating the same question as a separate reflection line. */
  readonly usesQuestion?: boolean;
  readonly render: (input: RoleFrameInput) => string;
};

export type RoleEmphasis = {
  readonly primary: EmphasisField;
  readonly secondary: EmphasisField;
  readonly frames: readonly RoleFrame[];
};

/** Extract the text a frame slot should use for a given emphasis field.
 *  Field grammar contracts (enforced by card-content validation):
 *  - meaning/advice: complete sentences, uppercase start.
 *  - tension: lowercase clause completing "the tension here is ...".
 *  - warning: lowercase clause completing "if nothing changes, ...".
 *  - questions: the engine passes the deterministically chosen question. */
export function emphasisText(content: OrientationContent, field: EmphasisField, questionIndex = 0): string {
  if (field === "questions") return content.questions[Math.min(questionIndex, content.questions.length - 1)];
  return content[field];
}

export const ROLE_EMPHASIS: Record<PositionRole, RoleEmphasis> = {
  problem: {
    primary: "tension",
    secondary: "meaning",
    frames: [
      {
        id: "problem-named",
        render: ({ cardName, subject, primaryText, secondaryText }) =>
          `${cardName} names what is actually wrong with ${subject}: the tension is ${primaryText}. ${secondaryText}`,
      },
      {
        id: "problem-territory",
        usesQuestion: true,
        render: ({ cardName, jurisdiction, primaryText, question }) =>
          `${cardName} governs ${jurisdiction}, and that is where the trouble lives — ${primaryText}. Sit with this: ${question}`,
      },
    ],
  },
  cause: {
    primary: "tension",
    secondary: "warning",
    frames: [
      {
        id: "cause-root",
        render: ({ cardName, primaryText, secondaryText }) =>
          `Trace it back and ${cardName} is at the root: ${primaryText}. Left unexamined, ${secondaryText}.`,
      },
      {
        id: "cause-origin",
        render: ({ cardName, jurisdiction, subject, primaryText }) =>
          `The origin story of ${subject} runs through ${jurisdiction} — ${cardName}'s ground. What set this in motion was ${primaryText}.`,
      },
    ],
  },
  advice: {
    primary: "advice",
    secondary: "meaning",
    frames: [
      {
        id: "advice-direct",
        render: ({ cardName, primaryText }) => `${cardName}'s counsel is direct: ${primaryText}`,
      },
      {
        id: "advice-grounded",
        render: ({ cardName, secondaryText, primaryText }) =>
          `${secondaryText} That is the ground ${cardName} stands on, and the move it points to: ${primaryText}`,
      },
    ],
  },
  keep: {
    primary: "meaning",
    secondary: "advice",
    frames: [
      {
        id: "keep-protect",
        render: ({ cardName, subject, primaryText }) =>
          `${cardName} marks what deserves protection in ${subject}. ${primaryText}`,
      },
      {
        id: "keep-core",
        render: ({ cardName, jurisdiction, primaryText, secondaryText }) =>
          `What ${cardName} guards — ${jurisdiction} — is the part of this to keep whole. ${primaryText} ${secondaryText}`,
      },
    ],
  },
  cut: {
    primary: "warning",
    secondary: "tension",
    frames: [
      {
        id: "cut-cost",
        render: ({ cardName, primaryText }) =>
          `${cardName} shows what this costs if you keep carrying it: ${primaryText}. That is the weight to set down.`,
      },
      {
        id: "cut-release",
        usesQuestion: true,
        render: ({ cardName, secondaryText, question }) =>
          `${cardName} lands here as permission to let something go — specifically, ${secondaryText}. Ask yourself: ${question}`,
      },
    ],
  },
  blocker: {
    primary: "tension",
    secondary: "warning",
    frames: [
      {
        id: "blocker-wall",
        render: ({ cardName, primaryText }) =>
          `The wall you keep hitting has a name — ${cardName} — and a shape: ${primaryText}.`,
      },
      {
        id: "blocker-cost",
        render: ({ cardName, subject, jurisdiction, primaryText, secondaryText }) =>
          `${cardName} stands between you and ${subject}. Its territory is ${jurisdiction}, and the block is ${primaryText}. If it stays unaddressed, ${secondaryText}.`,
      },
    ],
  },
  lever: {
    primary: "advice",
    secondary: "meaning",
    frames: [
      {
        id: "lever-multiplier",
        render: ({ cardName, primaryText }) =>
          `${cardName} is the lever in this spread — the move that multiplies instead of adds: ${primaryText}`,
      },
      {
        id: "lever-unlock",
        render: ({ cardName, jurisdiction, primaryText }) =>
          `The unlock runs through ${jurisdiction}, which is ${cardName}'s territory. ${primaryText}`,
      },
    ],
  },
  trajectory: {
    primary: "warning",
    secondary: "meaning",
    frames: [
      {
        id: "trajectory-unchanged",
        render: ({ cardName, primaryText }) =>
          `${cardName} is not a prediction — it is an extrapolation. If nothing changes, ${primaryText}.`,
      },
      {
        id: "trajectory-heading",
        usesQuestion: true,
        render: ({ cardName, primaryText, question }) =>
          `On the current heading, ${cardName} says: ${primaryText}. The course is still yours to correct — ${question}`,
      },
    ],
  },
  lesson: {
    primary: "questions",
    secondary: "meaning",
    frames: [
      {
        id: "lesson-question",
        usesQuestion: true,
        render: ({ cardName, primaryText, secondaryText }) =>
          `${secondaryText} The lesson ${cardName} leaves behind is a question worth keeping: ${primaryText}`,
      },
      {
        id: "lesson-principle",
        usesQuestion: true,
        render: ({ cardName, jurisdiction, primaryText }) =>
          `${cardName} distills this chapter down to ${jurisdiction}. Carry its question into the next build: ${primaryText}`,
      },
    ],
  },
  resource: {
    primary: "meaning",
    secondary: "advice",
    frames: [
      {
        id: "resource-fuel",
        render: ({ cardName, subject, primaryText }) =>
          `${cardName} marks what is feeding ${subject}. ${primaryText}`,
      },
      {
        id: "resource-asset",
        render: ({ cardName, jurisdiction, primaryText, secondaryText }) =>
          `Your working asset is ${jurisdiction} — ${cardName}'s ground. ${primaryText} ${secondaryText}`,
      },
    ],
  },
  insight: {
    primary: "meaning",
    secondary: "questions",
    frames: [
      {
        id: "insight-plain",
        usesQuestion: true,
        render: ({ cardName, primaryText, question }) =>
          `${primaryText} ${cardName} leaves one thing worth sitting with today: ${question}`,
      },
      {
        id: "insight-territory",
        render: ({ cardName, jurisdiction, primaryText }) =>
          `${cardName} speaks for ${jurisdiction}. ${primaryText}`,
      },
    ],
  },
};

// ---------- Deterministic frame selection ----------

/**
 * Pick a frame deterministically from a role's pool. Frames whose ids appear
 * in `used` are avoided when alternatives exist, so a multi-card reading never
 * renders every card through the same frame while others were available.
 */
export function chooseFrame<T extends { id: string }>(frames: readonly T[], seed: string, used: ReadonlySet<string> = new Set()): T {
  if (frames.length === 0) {
    throw new Error("chooseFrame requires at least one frame");
  }
  const fresh = frames.filter((frame) => !used.has(frame.id));
  const pool = fresh.length > 0 ? fresh : frames;
  return pool[hashString(seed) % pool.length];
}

// ---------- Position-name -> role lookup for stored/legacy position names ----------

/**
 * Role lookup by position display name. Covers current generic spread labels,
 * the daily position, and legacy labels that exist in stored journal history
 * (e.g. "Outcome", renamed to "If Nothing Changes" in current config).
 */
export const GENERIC_POSITION_ROLES: Readonly<Record<string, PositionRole>> = {
  Insight: "insight",
  "Daily Insight": "insight",
  Past: "cause",
  Present: "problem",
  Future: "trajectory",
  Problem: "problem",
  Cause: "cause",
  Advice: "advice",
  "If Nothing Changes": "trajectory",
  // Legacy label retained for stored history; renamed in current display config.
  Outcome: "trajectory",
  Lesson: "lesson",
};

export function roleForPositionName(positionName: string): PositionRole {
  return GENERIC_POSITION_ROLES[positionName] ?? "insight";
}
