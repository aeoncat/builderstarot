/**
 * Product-event vocabulary for the validation phase.
 *
 * First-party, privacy-conscious analytics: events carry ONLY allowlisted,
 * non-sensitive properties. Never raw project context, interpretation or
 * synthesis text, journal notes, emails, full URLs, or any user-entered text.
 * The zod schemas here are strict — unapproved names or properties are
 * rejected server-side and untypeable client-side.
 */

import { z } from "zod";

export const EVENT_RETENTION_DAYS = 180;

export const PRODUCT_EVENT_NAMES = [
  "landing_viewed",
  "account_created",
  "reading_started",
  "reading_completed",
  "project_reading_started",
  "project_reading_completed",
  "journal_entry_saved",
  "journal_entry_viewed",
  "return_visit",
  "pro_page_viewed",
  "pro_plan_selected",
  "pro_waitlist_started",
  "pro_waitlist_joined",
  "interview_interest_submitted",
  "validation_survey_viewed",
  "validation_survey_completed",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];

export const READING_SURFACES = ["daily", "single", "three", "five", "project-stage"] as const;
export type ReadingSurface = (typeof READING_SURFACES)[number];

export const PRO_PLAN_INTERESTS = [
  "monthly_5",
  "annual_39",
  "founding_lifetime_59",
  "interested_but_unsure",
  "would_not_pay",
] as const;
export type ProPlanInterest = (typeof PRO_PLAN_INTERESTS)[number];

const PROJECT_STAGE_KEYS = [
  "idea-spark",
  "planning-the-build",
  "mvp-mode",
  "stuck-blocked",
  "launch-prep",
  "feedback-loop",
  "burnout-doubt",
  "growth-monetization",
  "pivot-point",
  "completion-reflection",
] as const;

/**
 * The complete set of approved event properties. `.strict()` rejects anything
 * else. Every string property is a closed enum or a short slug — free text is
 * structurally impossible to send.
 */
export const eventPropsSchema = z
  .object({
    surface: z.enum(READING_SURFACES).optional(),
    spreadSize: z.number().int().min(1).max(5).optional(),
    stage: z.enum(PROJECT_STAGE_KEYS).optional(),
    authed: z.boolean().optional(),
    reversedCount: z.number().int().min(0).max(5).optional(),
    plan: z.enum(PRO_PLAN_INTERESTS).optional(),
    source: z
      .string()
      .max(40)
      .regex(/^[a-z0-9_-]+$/)
      .optional(),
    state: z.enum(["completed", "abandoned"]).optional(),
    hasSnapshot: z.boolean().optional(),
  })
  .strict();

export type ProductEventProps = z.infer<typeof eventPropsSchema>;

export const productEventSchema = z
  .object({
    name: z.enum(PRODUCT_EVENT_NAMES),
    visitorId: z
      .string()
      .min(8)
      .max(64)
      .regex(/^[a-zA-Z0-9-]+$/),
    props: eventPropsSchema.default({}),
  })
  .strict();

export type ProductEventInput = z.infer<typeof productEventSchema>;

/** Parse an incoming event payload; returns null when anything is unapproved. */
export function parseProductEvent(payload: unknown): ProductEventInput | null {
  const parsed = productEventSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}
