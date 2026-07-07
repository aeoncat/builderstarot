/**
 * Validation utilities for rich card content (Phase 1 foundation).
 *
 * Editorial rules are enforced as bounds and grammar contracts, not exact
 * sentence counts. Returned values are human-readable error strings; an empty
 * array means the content is valid.
 */

import {
  type CardContent,
  type OrientationContent,
  ENERGY_TAGS,
  EXPRESSION_TAGS,
  FOCUS_TAGS,
  FUNCTION_TAGS,
  REGISTERS,
} from "@/lib/card-content";

// Character bounds standing in for the "2-3 sentences with one concrete
// image" editorial guideline: catches shallow one-liners and unbounded essays.
export const MEANING_MIN_LENGTH = 160;
export const MEANING_MAX_LENGTH = 520;

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function startsLowercase(text: string) {
  return /^[a-z]/.test(text.trim());
}

function startsUppercase(text: string) {
  return /^[A-Z]/.test(text.trim());
}

function validateOrientation(cardLabel: string, orientationLabel: string, content: OrientationContent): string[] {
  const errors: string[] = [];
  const where = `${cardLabel} (${orientationLabel})`;

  if (content.meaning.trim().length < MEANING_MIN_LENGTH) {
    errors.push(`${where}: meaning is shorter than ${MEANING_MIN_LENGTH} characters — too shallow.`);
  }
  if (content.meaning.trim().length > MEANING_MAX_LENGTH) {
    errors.push(`${where}: meaning is longer than ${MEANING_MAX_LENGTH} characters — trim it.`);
  }
  if (!startsUppercase(content.meaning)) {
    errors.push(`${where}: meaning must be complete sentences starting uppercase.`);
  }

  if (!content.tension.trim()) {
    errors.push(`${where}: tension is empty.`);
  } else if (!startsLowercase(content.tension)) {
    errors.push(`${where}: tension must be a lowercase clause (completes "the tension here is ...").`);
  }

  if (!content.advice.trim()) {
    errors.push(`${where}: advice is empty.`);
  } else if (!startsUppercase(content.advice)) {
    errors.push(`${where}: advice must be an imperative sentence starting uppercase.`);
  }

  if (!content.warning.trim()) {
    errors.push(`${where}: warning is empty.`);
  } else if (!startsLowercase(content.warning)) {
    errors.push(`${where}: warning must be a lowercase clause (completes "if nothing changes, ...").`);
  }

  if (content.questions.length < 1 || content.questions.length > 2) {
    errors.push(`${where}: must have 1-2 reflection questions.`);
  }
  for (const question of content.questions) {
    if (!question.trim().endsWith("?")) {
      errors.push(`${where}: question "${question}" must end with "?".`);
    }
  }

  if (!REGISTERS.includes(content.register)) {
    errors.push(`${where}: invalid register "${content.register}".`);
  }
  if (!ENERGY_TAGS.includes(content.tags.energy)) {
    errors.push(`${where}: invalid energy tag "${content.tags.energy}".`);
  }
  if (!FOCUS_TAGS.includes(content.tags.focus)) {
    errors.push(`${where}: invalid focus tag "${content.tags.focus}".`);
  }
  if (!FUNCTION_TAGS.includes(content.tags.function)) {
    errors.push(`${where}: invalid function tag "${content.tags.function}".`);
  }
  if (!EXPRESSION_TAGS.includes(content.tags.expression)) {
    errors.push(`${where}: invalid expression tag "${content.tags.expression}".`);
  }

  return errors;
}

export function validateCardContent(card: CardContent): string[] {
  const errors: string[] = [];

  if (!KEBAB_CASE.test(card.slug)) {
    errors.push(`${card.name}: slug "${card.slug}" must be kebab-case.`);
  }
  if (!KEBAB_CASE.test(card.jurisdictionKey)) {
    errors.push(`${card.name}: jurisdictionKey "${card.jurisdictionKey}" must be kebab-case.`);
  }
  if (!card.jurisdiction.trim()) {
    errors.push(`${card.name}: jurisdiction prose is empty.`);
  }
  if (!card.classical.name.trim()) {
    errors.push(`${card.name}: classical correspondence name is empty.`);
  }
  if (!Number.isInteger(card.classical.numeral) || card.classical.numeral < 0 || card.classical.numeral > 21) {
    errors.push(`${card.name}: classical numeral ${card.classical.numeral} must be an integer 0-21.`);
  }
  if (card.contentVersion < 1) {
    errors.push(`${card.name}: contentVersion must be >= 1.`);
  }

  errors.push(...validateOrientation(card.name, "upright", card.upright));
  errors.push(...validateOrientation(card.name, "reversed", card.reversed));

  return errors;
}

/**
 * Cards permitted to share their expression tag across upright and reversed.
 *
 * Upright and reversed should normally differ in expression. Every entry here
 * is an intentional, documented exception (slug -> rationale). Currently empty:
 * all 22 cards differ in expression (uprights are "clear"; reverseds are one of
 * blocked/distorted/excessive/avoided/released). Add an entry only with a
 * genuine semantic reason for the shared expression.
 */
export const DECK_EXPRESSION_EXEMPTIONS: ReadonlyMap<string, string> = new Map<string, string>([]);

export type DeckValidationOptions = {
  /** Slugs allowed to share the expression tag across orientations. Upright
   *  and reversed should normally differ in expression; exemptions must be
   *  explicit and intentional. Defaults to DECK_EXPRESSION_EXEMPTIONS. */
  allowSharedExpression?: ReadonlySet<string>;
};

export function validateDeckContent(cards: readonly CardContent[], options: DeckValidationOptions = {}): string[] {
  const errors: string[] = [];
  const allowSharedExpression = options.allowSharedExpression ?? new Set(DECK_EXPRESSION_EXEMPTIONS.keys());

  for (const card of cards) {
    errors.push(...validateCardContent(card));

    if (card.upright.tags.expression === card.reversed.tags.expression && !allowSharedExpression.has(card.slug)) {
      errors.push(
        `${card.name}: upright and reversed share expression "${card.upright.tags.expression}" without an explicit exemption.`,
      );
    }
    if (card.upright.meaning === card.reversed.meaning) {
      errors.push(`${card.name}: upright and reversed meanings are identical.`);
    }
  }

  for (const field of ["slug", "name", "jurisdictionKey"] as const) {
    const seen = new Map<string, string>();
    for (const card of cards) {
      const value = card[field];
      const previous = seen.get(value);
      if (previous) {
        errors.push(`Duplicate ${field} "${value}" on ${previous} and ${card.name}.`);
      } else {
        seen.set(value, card.name);
      }
    }
  }

  const numerals = new Map<number, string>();
  for (const card of cards) {
    const previous = numerals.get(card.classical.numeral);
    if (previous) {
      errors.push(`Duplicate classical numeral ${card.classical.numeral} on ${previous} and ${card.name}.`);
    } else {
      numerals.set(card.classical.numeral, card.name);
    }
  }

  return errors;
}
