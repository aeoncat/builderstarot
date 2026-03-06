export const ARCANA_VALUES = ["MAJOR", "MINOR"] as const;
export const SUIT_VALUES = ["IDEAS", "EMOTIONS", "CODE", "GROWTH"] as const;
export const RANK_VALUES = [
  "ACE",
  "TWO",
  "THREE",
  "FOUR",
  "FIVE",
  "SIX",
  "SEVEN",
  "EIGHT",
  "NINE",
  "TEN",
  "NOVICE",
  "APPRENTICE",
  "EXPERT",
  "LEAD",
] as const;
export const ORIENTATION_VALUES = ["UPRIGHT", "REVERSED"] as const;

export type ArcanaType = (typeof ARCANA_VALUES)[number];
export type SuitType = (typeof SUIT_VALUES)[number];
export type RankType = (typeof RANK_VALUES)[number];
export type OrientationType = (typeof ORIENTATION_VALUES)[number];

export type CardDTO = {
  id: string;
  name: string;
  arcana: ArcanaType;
  suit: SuitType | null;
  rank: RankType | null;
  keywords: string[];
  uprightMeaning: string;
  reversedMeaning: string;
  promptQuestions: string[];
  imageUrl: string | null;
  createdAt: string;
};

export type DrawResult = {
  spreadType: string;
  spreadSessionId?: string | null;
  cards: Array<{
    positionName: string;
    orientation: OrientationType;
    card: CardDTO;
  }>;
};

export type JournalEntryDTO = {
  id: string;
  spreadType: string;
  userNotes: string;
  createdAt: string;
  updatedAt: string;
  spreadSessionId: string | null;
  cards: Array<{
    id: string;
    positionName: string;
    orientation: OrientationType;
    card: CardDTO;
  }>;
};
