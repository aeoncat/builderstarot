import { ArcanaType, OrientationType, RankType, SuitType } from "@/lib/types";

export const SUIT_LABELS: Record<SuitType, string> = {
  IDEAS: "Ideas 💡",
  EMOTIONS: "Emotions ❤️",
  CODE: "Code </>",
  GROWTH: "Growth 🌱",
};

export const RANK_LABELS: Partial<Record<RankType, string>> = {
  NOVICE: "Novice",
  APPRENTICE: "Apprentice",
  EXPERT: "Expert",
  LEAD: "Lead",
};

export const ARCANA_LABELS: Record<ArcanaType, string> = {
  MAJOR: "Major",
  MINOR: "Minor",
};

export const ORIENTATION_LABELS: Record<OrientationType, string> = {
  UPRIGHT: "Upright",
  REVERSED: "Reversed",
};

export const SPREADS = {
  single: {
    key: "single",
    name: "1-Card",
    positions: ["Insight"],
  },
  three: {
    key: "three",
    name: "3-Card",
    positions: ["Past", "Present", "Future"],
  },
  five: {
    key: "five",
    name: "5-Card",
    positions: ["Problem", "Cause", "Advice", "Outcome", "Lesson"],
  },
} as const;

export const DEFAULT_REVERSED_CHANCE = 30;
