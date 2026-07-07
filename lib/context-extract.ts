/**
 * Conservative context extraction for readings.
 *
 * The deterministic engine cannot genuinely parse free text, so we never quote
 * the user's context back. We extract at most a short subject noun phrase from
 * safe, simple signals (a recognizable product type, a project name), and fall
 * back to a stage-derived or generic subject. The reading must read cleanly
 * with no context at all.
 */

import type { ProjectStageKey } from "@/lib/projectStages";

// Longest-match-first list of recognizable product types. Deliberately small
// and literal: a keyword only extracts what the user plainly said.
const PRODUCT_TYPES = [
  "habit tracker",
  "landing page",
  "design system",
  "mobile app",
  "web app",
  "browser extension",
  "chrome extension",
  "side project",
  "newsletter",
  "portfolio",
  "dashboard",
  "podcast",
  "plugin",
  "library",
  "course",
  "tracker",
  "website",
  "game",
  "book",
  "blog",
  "app",
  "api",
  "cli",
  "bot",
  "saas",
  "store",
  "tool",
] as const;

const STAGE_SUBJECTS: Record<ProjectStageKey, string> = {
  "idea-spark": "this early idea",
  "planning-the-build": "the plan",
  "mvp-mode": "the first version",
  "stuck-blocked": "the stuck work",
  "launch-prep": "the launch",
  "feedback-loop": "the next iteration",
  "burnout-doubt": "this season of the work",
  "growth-monetization": "the growth push",
  "pivot-point": "the direction",
  "completion-reflection": "the finished work",
};

const FALLBACK_SUBJECT = "this project";

function findProductType(context: string): string | null {
  const lowered = ` ${context.toLowerCase()} `;
  for (const productType of PRODUCT_TYPES) {
    // Word-boundary match so "app" does not fire inside "happen".
    const pattern = new RegExp(`\\b${productType.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    if (pattern.test(lowered)) return productType;
  }
  return null;
}

export type SubjectInput = {
  context?: string;
  projectName?: string;
  stage?: ProjectStageKey;
};

/**
 * Derive a short subject noun phrase for frame slots ("your habit tracker",
 * "Nightjar", "the launch", "this project"). Deterministic; never empty.
 */
export function extractSubject({ context, projectName, stage }: SubjectInput): string {
  const trimmedContext = context?.trim() ?? "";
  if (trimmedContext) {
    const productType = findProductType(trimmedContext);
    if (productType) return `your ${productType}`;
  }

  const trimmedName = projectName?.trim() ?? "";
  // Only use short, name-like project names verbatim; anything longer risks
  // parroting a sentence the user typed into the field.
  if (trimmedName && trimmedName.length <= 40 && !/[.!?\n]/.test(trimmedName)) {
    return trimmedName;
  }

  if (stage) return STAGE_SUBJECTS[stage];
  return FALLBACK_SUBJECT;
}
