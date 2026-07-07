import type { PositionRole } from "@/lib/position-roles";
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

export type SpreadPosition = {
  /** Display label; stored on new draws. Historical draws keep their stored labels. */
  label: string;
  /** Semantic role for the interpretation engine. */
  role: PositionRole;
};

// "Outcome" was renamed to "If Nothing Changes" in display config: readings
// frame the future as extrapolation, not prediction. Stored history keeps the
// old label (see GENERIC_POSITION_ROLES for the legacy mapping).
export const SPREADS: Record<string, { key: string; name: string; positions: readonly SpreadPosition[] }> = {
  single: {
    key: "single",
    name: "1-Card",
    positions: [{ label: "Insight", role: "insight" }],
  },
  three: {
    key: "three",
    name: "3-Card",
    positions: [
      { label: "Past", role: "cause" },
      { label: "Present", role: "problem" },
      { label: "Future", role: "trajectory" },
    ],
  },
  five: {
    key: "five",
    name: "5-Card",
    positions: [
      { label: "Problem", role: "problem" },
      { label: "Cause", role: "cause" },
      { label: "Advice", role: "advice" },
      { label: "If Nothing Changes", role: "trajectory" },
      { label: "Lesson", role: "lesson" },
    ],
  },
};

export const DEFAULT_REVERSED_CHANCE = 30;
