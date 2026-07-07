/**
 * Pure, deterministic card-interpretation engine (Phase 2).
 *
 * interpretCard composes structured card content (lib/card-content.ts) with a
 * semantic position role (lib/position-roles.ts): the card is the source of
 * meaning, the role decides which of its fields are foregrounded, the
 * orientation selects the content bundle, and the register shapes the action's
 * voice. Same inputs always produce the same output.
 *
 * No multi-card synthesis lives here — that is Phase 3.
 */

import {
  type CardContent,
  type EmotionalRegister,
  type OrientationContent,
  getCardContentByName,
  orientationContent,
} from "@/lib/card-content";
import { extractSubject } from "@/lib/context-extract";
import {
  type PositionRole,
  type RoleFrameInput,
  ROLE_EMPHASIS,
  chooseFrame,
  emphasisText,
} from "@/lib/position-roles";
import type { ProjectStageKey } from "@/lib/projectStages";
import { hashString } from "@/lib/random";
import type { OrientationType } from "@/lib/types";

/**
 * Interpretation-engine version. Bump when frame pools, role emphasis, or the
 * composition logic change in a way that alters rendered output. Intended to be
 * stamped onto future saved-reading/journal snapshots so an entry records which
 * engine produced its text. Version 1 was the generic stage-template era
 * (pre-Phase 2); version 2 is the structured card x role engine.
 */
export const INTERPRETATION_ENGINE_VERSION = 2;

export type CardInterpretation = {
  interpretation: string;
  nextAction: string;
  reflectionQuestion?: string;
  frameId: string;
  actionFrameId: string;
};

export type InterpretCardInput = {
  card: CardContent;
  orientation: OrientationType;
  role: PositionRole;
  positionLabel: string;
  context?: string;
  projectName?: string;
  stage?: ProjectStageKey;
  /** Any stable string identifying this draw slot; drives frame and question
   *  selection. Same seed (and other inputs) => same output. */
  seed: string;
  /** Interpretation frame ids already used earlier in this reading; avoided
   *  when alternatives exist so cards in one spread don't rhyme. */
  usedFrameIds?: ReadonlySet<string>;
  /** Action frame ids already used earlier in this reading. */
  usedActionFrameIds?: ReadonlySet<string>;
};

// ---------- Register-aware action frames ----------
// The card's authored advice is always the spine of the action; the register
// decides the voice around it. Advice is authored as one imperative sentence,
// concretely doable, so actions stay builder-sized by construction.

type ActionFrame = {
  readonly id: string;
  readonly render: (input: { advice: string; warning: string; jurisdiction: string }) => string;
};

// Four frames per register: gravity and quiet dominate the deck, so two
// wrappers each made a handful of phrases conspicuous to repeat users (see the
// Phase 2.5 repetition audit). Wider pools + the reading's used-frame tracking
// keep any single wrapper from becoming a tell.
const ACTION_FRAMES: Record<EmotionalRegister, readonly ActionFrame[]> = {
  jolt: [
    { id: "action-jolt-now", render: ({ advice }) => `${advice} Do it before the day ends.` },
    {
      id: "action-jolt-bill",
      render: ({ advice, warning }) => `${advice} Skip it and the bill is already itemized: ${warning}.`,
    },
    { id: "action-jolt-today", render: ({ advice }) => `${advice} Not tomorrow — today.` },
    { id: "action-jolt-clock", render: ({ advice }) => `${advice} Put a clock on it and start now.` },
  ],
  warmth: [
    {
      id: "action-warmth-small",
      render: ({ advice }) => `${advice} Twenty minutes of real beats a week of perfect.`,
    },
    {
      id: "action-warmth-side",
      render: ({ advice }) => `The card is on your side here. ${advice}`,
    },
    { id: "action-warmth-doable", render: ({ advice }) => `${advice} It is smaller than it feels — start there.` },
    { id: "action-warmth-earned", render: ({ advice }) => `${advice} You have done harder things than this.` },
  ],
  gravity: [
    {
      id: "action-gravity-cost",
      render: ({ advice, warning }) => `${advice} The cost of skipping this is already written: ${warning}.`,
    },
    {
      id: "action-gravity-load",
      render: ({ advice }) => `${advice} Treat it as load-bearing, not optional.`,
    },
    { id: "action-gravity-honest", render: ({ advice }) => `${advice} This is the honest move, not the comfortable one.` },
    { id: "action-gravity-name", render: ({ advice }) => `${advice} Name it plainly, even if it stings.` },
  ],
  quiet: [
    {
      id: "action-quiet-block",
      render: ({ advice }) => `Set aside an unhurried half hour. ${advice}`,
    },
    {
      id: "action-quiet-single",
      render: ({ advice }) => `${advice} One clean step is enough for today.`,
    },
    { id: "action-quiet-room", render: ({ advice }) => `${advice} Give it room; there is no rush to force it.` },
    { id: "action-quiet-first", render: ({ advice }) => `Before anything else, get quiet. ${advice}` },
  ],
};

// ---------- Engine internals (exported for cross-product testing) ----------

export function buildFrameInput(
  card: CardContent,
  content: OrientationContent,
  role: PositionRole,
  positionLabel: string,
  subject: string,
  question: string,
): RoleFrameInput {
  const emphasis = ROLE_EMPHASIS[role];
  return {
    cardName: card.name,
    jurisdiction: card.jurisdiction,
    positionLabel,
    subject,
    primaryText: emphasis.primary === "questions" ? question : emphasisText(content, emphasis.primary),
    secondaryText: emphasis.secondary === "questions" ? question : emphasisText(content, emphasis.secondary),
    question,
  };
}

/** Deterministically choose which of the orientation's 1-2 questions to use. */
export function chooseQuestionIndex(content: OrientationContent, seed: string): number {
  return hashString(`${seed}:question`) % content.questions.length;
}

// ---------- The engine ----------

export function interpretCard(input: InterpretCardInput): CardInterpretation {
  const { card, orientation, role, positionLabel, seed } = input;
  const content = orientationContent(card, orientation);
  const emphasis = ROLE_EMPHASIS[role];

  const subject = extractSubject({ context: input.context, projectName: input.projectName, stage: input.stage });
  const questionIndex = chooseQuestionIndex(content, seed);
  const question = content.questions[questionIndex];

  const frame = chooseFrame(emphasis.frames, `${seed}:frame:${role}`, input.usedFrameIds);
  const interpretation = frame.render(buildFrameInput(card, content, role, positionLabel, subject, question));

  const actionPool = ACTION_FRAMES[content.register];
  const actionFrame = chooseFrame(actionPool, `${seed}:action:${content.register}`, input.usedActionFrameIds);
  const nextAction = actionFrame.render({
    advice: content.advice,
    warning: content.warning,
    jurisdiction: card.jurisdiction,
  });

  // If the interpretation frame already embedded the chosen question, offer
  // the orientation's other question when one exists; never repeat the same
  // question twice in one card's output.
  let reflectionQuestion: string | undefined;
  if (frame.usesQuestion) {
    reflectionQuestion = content.questions.length > 1 ? content.questions[1 - questionIndex] : undefined;
  } else {
    reflectionQuestion = question;
  }

  return {
    interpretation,
    nextAction,
    reflectionQuestion,
    frameId: frame.id,
    actionFrameId: actionFrame.id,
  };
}

// ---------- Fallback wrapper for cards drawn from the database ----------

export type DrawnCardLike = {
  name: string;
  uprightMeaning: string;
  reversedMeaning: string;
  promptQuestions: string[];
};

export type DrawnCardInterpretation = CardInterpretation & {
  /** False when the card has no rich registry content (retained legacy cards);
   *  the interpretation is then the stored database meaning. */
  hasRichContent: boolean;
};

export const LEGACY_FRAME_ID = "legacy-meaning";
export const LEGACY_ACTION_FRAME_ID = "legacy-none";

/** Canonical seed for a drawn card slot, shared by the card renderer and the
 *  synthesis builder so a card's displayed action and its synthesis-sourced
 *  action are always identical. */
export function drawnCardSeed(cardId: string, positionName: string, orientation: OrientationType): string {
  return `${cardId}:${positionName}:${orientation}`;
}

export function interpretDrawnCard(
  input: Omit<InterpretCardInput, "card"> & { card: DrawnCardLike },
): DrawnCardInterpretation {
  const richCard = getCardContentByName(input.card.name);

  if (richCard) {
    return { ...interpretCard({ ...input, card: richCard }), hasRichContent: true };
  }

  // Legacy card retained in the database but absent from the registry: fall
  // back to the stored meaning; no synthesized action is safe to invent.
  const meaning = input.orientation === "REVERSED" ? input.card.reversedMeaning : input.card.uprightMeaning;
  return {
    interpretation: meaning,
    nextAction: "",
    reflectionQuestion: input.card.promptQuestions[0],
    frameId: LEGACY_FRAME_ID,
    actionFrameId: LEGACY_ACTION_FRAME_ID,
    hasRichContent: false,
  };
}
