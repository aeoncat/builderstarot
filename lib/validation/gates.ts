/**
 * Eligibility gates for Pro discovery prompts and the validation survey.
 *
 * Pure, deterministic decision functions — unit-tested directly; the UI wires
 * them to localStorage. Design rules:
 *  - never prompt before the first completed reading
 *  - never prompt mid-reading (enforced by placement, asserted here via stage)
 *  - never prompt right after a Burnout/Doubt reading or a gravity-dominant
 *    (emotionally difficult) reading
 *  - frequency-limited so repeat users are not nagged
 */

import type { EmotionalRegister } from "@/lib/card-content";
import type { ProjectStageKey } from "@/lib/projectStages";

export const PRO_PROMPT_MIN_READINGS = 2;
export const PRO_PROMPT_COOLDOWN_DAYS = 7;
export const SURVEY_MIN_READINGS = 3;

export const PRO_PROMPT_LAST_SHOWN_KEY = "bt_pro_prompt_last";
export const SURVEY_DONE_KEY = "bt_survey_done";

export type ProPromptInput = {
  completedReadings: number;
  lastShownAt: string | null; // ISO date of last prompt, or null
  now: Date;
  /** Stage of the reading the prompt would follow, when applicable. */
  stage?: ProjectStageKey | null;
  /** Registers of the drawn orientations, when following a reading. */
  registers?: readonly EmotionalRegister[];
};

export function isEmotionallyDifficultReading(
  stage: ProjectStageKey | null | undefined,
  registers: readonly EmotionalRegister[] | undefined,
): boolean {
  if (stage === "burnout-doubt") return true;
  if (!registers || registers.length === 0) return false;
  const gravity = registers.filter((register) => register === "gravity").length;
  return gravity * 2 > registers.length; // gravity-dominant = majority gravity
}

export function shouldShowProPrompt(input: ProPromptInput): boolean {
  if (input.completedReadings < PRO_PROMPT_MIN_READINGS) return false;
  if (isEmotionallyDifficultReading(input.stage, input.registers)) return false;
  if (input.lastShownAt) {
    const last = Date.parse(input.lastShownAt);
    if (Number.isFinite(last)) {
      const elapsedDays = (input.now.getTime() - last) / 86_400_000;
      if (elapsedDays < PRO_PROMPT_COOLDOWN_DAYS) return false;
    }
  }
  return true;
}

export type SurveyEligibilityInput = {
  isAuthenticated: boolean;
  completedReadings: number;
  alreadyCompletedOrDismissed: boolean;
};

export function isSurveyEligible(input: SurveyEligibilityInput): boolean {
  if (!input.isAuthenticated) return false;
  if (input.alreadyCompletedOrDismissed) return false;
  return input.completedReadings >= SURVEY_MIN_READINGS;
}
