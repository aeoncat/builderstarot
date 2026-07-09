import { z } from "zod";

import { ORIENTATION_VALUES } from "@/lib/types";

export const drawRequestSchema = z.object({
  spreadType: z.string().min(1),
  positions: z.array(z.string().min(1)).min(1),
  reversedChance: z.number().min(0).max(100).default(30),
});

export const journalCardSchema = z.object({
  cardId: z.string().min(1),
  positionName: z.string().min(1),
  orientation: z.enum(ORIENTATION_VALUES),
  // Optional reading snapshot: the exact rendered text the user saw. Never the
  // user's raw project context.
  interpretationText: z.string().max(2000).optional(),
  nextActionText: z.string().max(2000).optional(),
  reflectionQuestionText: z.string().max(500).optional(),
  positionRole: z.string().max(30).optional(),
  cardContentVersion: z.number().int().positive().optional(),
});

export const createJournalSchema = z.object({
  spreadType: z.string().min(1),
  notes: z.string().max(3000).optional().default(""),
  spreadSessionId: z.string().optional(),
  cards: z.array(journalCardSchema).min(1),
  // Optional entry-level snapshot (project readings): synthesis + safe subject.
  projectStage: z.string().max(40).optional(),
  subject: z.string().max(80).optional(),
  synthesisHeadline: z.string().max(200).optional(),
  synthesisSummary: z.string().max(2000).optional(),
  synthesisPriorityAction: z.string().max(1000).optional(),
  engineVersion: z.number().int().positive().optional(),
  synthesisVersion: z.number().int().positive().optional(),
});

export const updateJournalSchema = z.object({
  notes: z.string().max(3000),
});

export const cardQuerySchema = z.object({
  search: z.string().optional(),
});

export const waitlistSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    planPreference: z.enum(["monthly_5", "annual_39", "founding_lifetime_59", "interested_but_unsure", "would_not_pay"]),
    interviewOptIn: z.boolean().default(false),
    updatesConsent: z.boolean(),
    /** Honeypot — must be empty; bots that fill it get a silent success. */
    website: z.string().max(200).optional().default(""),
  })
  .strict();

export const surveySchema = z
  .object({
    changedPlans: z.enum(["yes", "somewhat", "no"]),
    topFeature: z.enum([
      "saved_projects",
      "journal_history",
      "card_patterns",
      "unlimited_project_readings",
      "export",
      "none",
    ]),
    pricePreference: z.enum(["monthly_5", "annual_39", "founding_lifetime_59", "not_at_these_prices", "free_only"]),
    interviewOptIn: z.boolean().default(false),
  })
  .strict();
