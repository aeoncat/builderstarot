import { type Card, type JournalEntry, type JournalEntryCard } from "@prisma/client";

import { type ArcanaType, type OrientationType, type RankType, type SuitType } from "@/lib/types";

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function serializeCard(card: Card) {
  return {
    ...card,
    arcana: card.arcana as ArcanaType,
    suit: card.suit as SuitType | null,
    rank: card.rank as RankType | null,
    keywords: parseStringArray(card.keywords),
    promptQuestions: parseStringArray(card.promptQuestions),
  };
}

type JournalCardWithCard = JournalEntryCard & {
  card: Card;
};

type EntryWithCards = JournalEntry & {
  cards: JournalCardWithCard[];
};

export function serializeJournalEntry(entry: EntryWithCards) {
  return {
    id: entry.id,
    spreadType: entry.spreadType,
    userNotes: entry.userNotes,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    spreadSessionId: entry.spreadSessionId,
    cards: entry.cards
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        id: item.id,
        positionName: item.positionName,
        orientation: item.orientation,
        card: serializeCard(item.card),
      })),
  };
}

export function meaningForOrientation(upright: string, reversed: string, orientation: OrientationType) {
  return orientation === "REVERSED" ? reversed : upright;
}
