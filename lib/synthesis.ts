/**
 * Spread synthesis — public entry point (Phase 3).
 *
 * Bridges drawn-card data to the analysis + rendering layers. Synthesis applies
 * only to readings with two or more cards; single-card and daily readings never
 * receive it. Legacy cards (no rich content) degrade safely: they still occupy a
 * position with a jurisdiction-less fallback, but contribute no tag patterns.
 */

import { getCardContentByName } from "@/lib/card-content";
import { roleCategory, type PositionRole } from "@/lib/position-roles";
import {
  type SpreadAnalysis,
  type SpreadCardFact,
  analyzeSpread,
} from "@/lib/synthesis-analyze";
import { type SpreadSynthesis, renderSpreadSynthesis } from "@/lib/synthesis-render";
import type { OrientationType } from "@/lib/types";

/** Bump when pattern detection or synthesis rendering changes user-visible
 *  output. Stamped onto journal snapshots. */
export const SYNTHESIS_ENGINE_VERSION = 1;

export type SynthesisCardInput = {
  cardId: string;
  name: string;
  orientation: OrientationType;
  role: PositionRole;
  positionLabel: string;
  /** The individual next action already shown for this card (Phase 2 output). */
  nextAction: string;
};

export function buildSpreadFacts(cards: SynthesisCardInput[]): SpreadCardFact[] {
  return cards.map((card, index) => {
    const content = getCardContentByName(card.name);
    const orientationContent = content
      ? card.orientation === "REVERSED"
        ? content.reversed
        : content.upright
      : null;

    return {
      index,
      name: card.name,
      slug: content?.slug ?? null,
      jurisdiction: content?.jurisdiction ?? null,
      jurisdictionKey: content?.jurisdictionKey ?? null,
      orientation: card.orientation,
      role: card.role,
      category: roleCategory(card.role),
      positionLabel: card.positionLabel,
      tags: orientationContent?.tags ?? null,
      register: orientationContent?.register ?? null,
      nextAction: card.nextAction,
      hasRichContent: content !== null,
    } satisfies SpreadCardFact;
  });
}

export type ReadingSynthesis = {
  analysis: SpreadAnalysis;
  synthesis: SpreadSynthesis;
};

export type SynthesizeReadingInput = {
  cards: SynthesisCardInput[];
  spreadType: string;
  subject: string;
  seed: string;
};

/**
 * Produce the connected-reading synthesis for a multi-card spread, or `null`
 * when the spread has fewer than two cards (single-card / daily readings).
 */
export function synthesizeReading({ cards, spreadType, subject, seed }: SynthesizeReadingInput): ReadingSynthesis | null {
  if (cards.length < 2) return null;

  const facts = buildSpreadFacts(cards);
  const analysis = analyzeSpread({ cards: facts, spreadType, subject });
  const synthesis = renderSpreadSynthesis({ analysis, spreadType, subject, seed });
  return { analysis, synthesis };
}
