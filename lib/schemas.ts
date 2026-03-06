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
});

export const createJournalSchema = z.object({
  spreadType: z.string().min(1),
  notes: z.string().max(3000).optional().default(""),
  spreadSessionId: z.string().optional(),
  cards: z.array(journalCardSchema).min(1),
});

export const updateJournalSchema = z.object({
  notes: z.string().max(3000),
});

export const cardQuerySchema = z.object({
  search: z.string().optional(),
  arcana: z.enum(["MAJOR", "MINOR"]).optional(),
  suit: z.enum(["IDEAS", "EMOTIONS", "CODE", "GROWTH"]).optional(),
  rank: z
    .enum(["ACE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "NOVICE", "APPRENTICE", "EXPERT", "LEAD"])
    .optional(),
});
