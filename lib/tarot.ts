import { type Card } from "@prisma/client";

import { deterministicIndex, hashString, randomInt } from "@/lib/random";
import { type OrientationType } from "@/lib/types";

export function pickOrientation(reversedChance: number, seed?: string): OrientationType {
  if (reversedChance <= 0) return "UPRIGHT";
  if (reversedChance >= 100) return "REVERSED";

  if (seed) {
    const value = hashString(seed) % 100;
    return value < reversedChance ? "REVERSED" : "UPRIGHT";
  }

  return Math.random() * 100 < reversedChance ? "REVERSED" : "UPRIGHT";
}

export function drawCards(cards: Card[], count: number, reversedChance: number) {
  const pool = [...cards];
  const picked: Array<{ card: Card; orientation: OrientationType }> = [];

  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const index = randomInt(pool.length);
    const [card] = pool.splice(index, 1);
    picked.push({ card, orientation: pickOrientation(reversedChance) });
  }

  return picked;
}

export function getDeterministicDaily(cards: Card[], seed: string, reversedChance: number) {
  const card = cards[deterministicIndex(seed, cards.length)];
  const orientation = pickOrientation(reversedChance, `${seed}:orientation`);
  return { card, orientation };
}
