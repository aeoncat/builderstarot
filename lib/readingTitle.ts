/**
 * Centralized, user-facing titles for saved readings.
 *
 * Journal entries store an internal `spreadType` slug (e.g.
 * "project-stage:launch-prep") and, for project readings, a `projectStage` key
 * plus (for guests) the saved `projectName`. Internal identifiers must never
 * surface in titles, so every journal surface routes through here rather than
 * rendering the raw slug.
 */

import { PROJECT_STAGES, type ProjectStageKey } from "@/lib/projectStages";

const PROJECT_STAGE_PREFIX = "project-stage:";

// Friendly names for the non-project spread slugs used across the app
// (see lib/domain.ts SPREADS and the daily/draw surfaces).
const SPREAD_LABELS: Record<string, string> = {
  single: "Single-Card Reading",
  three: "Three-Card Reading",
  five: "Five-Card Reading",
  daily: "Daily Card Reading",
};

function titleCaseSlug(slug: string): string {
  return slug
    .split(/[-_:\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Human-readable label for a project stage key ("launch-prep" -> "Launch Prep").
 * Falls back to a title-cased slug for unknown keys so nothing raw leaks.
 */
export function stageLabel(stageKey: string): string {
  const known = PROJECT_STAGES.find((stage) => stage.key === (stageKey as ProjectStageKey));
  return known ? known.name : titleCaseSlug(stageKey);
}

export type ReadingTitle = {
  /** Primary line — the project name when known, otherwise the reading name. */
  title: string;
  /** Optional supporting line (e.g. "Launch Prep Reading") when a name leads. */
  label?: string;
};

export type ReadingTitleInput = {
  spreadType: string;
  projectStage?: string | null;
  projectName?: string | null;
};

/**
 * Build a user-facing title for a saved reading. Never returns a raw slug.
 *
 * Project reading with a saved name -> { title: name, label: "<Stage> Reading" }
 * Project reading without a name    -> { title: "<Stage> Reading" }
 * Any other spread                  -> { title: "<Friendly> Reading" }
 */
export function formatReadingTitle({ spreadType, projectStage, projectName }: ReadingTitleInput): ReadingTitle {
  const isProject = Boolean(projectStage) || spreadType.startsWith(PROJECT_STAGE_PREFIX);

  if (isProject) {
    // Prefer the stored stage key; legacy entries carry it only in the slug.
    const stageKey = (projectStage?.trim() || spreadType.slice(PROJECT_STAGE_PREFIX.length)).trim();
    const stageReading = `${stageLabel(stageKey)} Reading`;
    const name = projectName?.trim();
    return name ? { title: name, label: stageReading } : { title: stageReading };
  }

  const known = SPREAD_LABELS[spreadType];
  if (known) return { title: known };

  // Unknown/legacy slug — prettify defensively so no identifier leaks.
  const pretty = titleCaseSlug(spreadType);
  return { title: /reading$/i.test(pretty) ? pretty : `${pretty} Reading` };
}
