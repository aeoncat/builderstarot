/**
 * Daily-card selection.
 *
 * New daily draws (authenticated and guest) may only select from the official
 * current 22-card deck. Retired/legacy cards remain in the database so old or
 * test records still render through the interpretation engine's fallback, but
 * they are never eligible for a new daily draw.
 *
 * Selection is deterministic: the same identity seed on the same calendar date
 * yields the same card and orientation.
 */

import { CURRENT_DECK_CARD_NAMES, sortByCreatorMajorOrder } from "@/lib/card-deck";
import { deterministicIndex } from "@/lib/random";
import { pickOrientation } from "@/lib/tarot";
import type { OrientationType } from "@/lib/types";

export const DAILY_REVERSED_CHANCE = 30;

const CURRENT_DECK_NAMES = new Set<string>(CURRENT_DECK_CARD_NAMES);

/** Filter an arbitrary card list to the current deck, in canonical deck order
 *  so selection is stable regardless of database row ids or query order. */
export function eligibleDailyCards<T extends { name: string }>(cards: T[]): T[] {
  return sortByCreatorMajorOrder(cards.filter((card) => CURRENT_DECK_NAMES.has(card.name)));
}

/**
 * Deterministically pick the daily card and orientation for a seed. The seed
 * should encode identity + calendar date (e.g. `${userId}:${dateKey}`).
 * Returns `card: null` only if no eligible cards exist.
 */
export function selectDailyDraw<T extends { name: string }>(
  cards: T[],
  seed: string,
  reversedChance: number = DAILY_REVERSED_CHANCE,
): { card: T | null; orientation: OrientationType } {
  const pool = eligibleDailyCards(cards);
  if (pool.length === 0) {
    return { card: null, orientation: "UPRIGHT" };
  }
  const card = pool[deterministicIndex(seed, pool.length)];
  const orientation = pickOrientation(reversedChance, `${seed}:orientation`);
  return { card, orientation };
}
