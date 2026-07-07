/**
 * Spread synthesis — analysis layer (Phase 3).
 *
 * Pure, deterministic pattern detection over a multi-card spread. Produces
 * structured, inspectable facts only; no user-facing prose (that is the render
 * layer). Every pattern references cards by their spread index, so a pattern
 * can never cite a card that was not in the spread.
 *
 * Guiding rule: a shared tag is evidence to examine, not proof of meaning. A
 * pattern must clear a confidence threshold to be selected, otherwise the
 * reading falls back to a neutral positional summary.
 */

import type { EmotionalRegister, EnergyTag, FunctionTag, SynthesisTags } from "@/lib/card-content";
import { type PositionRole, type RoleCategory } from "@/lib/position-roles";
import type { OrientationType } from "@/lib/types";

// ---------- Input facts ----------

export type SpreadCardFact = {
  index: number;
  name: string;
  slug: string | null;
  jurisdiction: string | null;
  jurisdictionKey: string | null;
  orientation: OrientationType;
  role: PositionRole;
  category: RoleCategory;
  positionLabel: string;
  tags: SynthesisTags | null;
  register: EmotionalRegister | null;
  /** The individual next action already produced in Phase 2 (may be "" for legacy). */
  nextAction: string;
  hasRichContent: boolean;
};

// ---------- Patterns ----------

export type PatternKind = "diagnosis-remedy" | "tension" | "progression" | "reinforcement" | "focus-concentration";

export type SynthesisPattern = {
  kind: PatternKind;
  confidence: number; // 0..1
  cardIndices: number[];
  cardSlugs: string[];
  reason: string;
  /** Extra machine-readable specifics for tests and prose (never user-facing raw). */
  detail?: Record<string, string>;
  /** Diagnosis-remedy specifics. */
  diagnosticIndices?: number[];
  remedyIndices?: number[];
  /** Focus-concentration is only ever a supporting fact, never a headline. */
  supportingOnly?: boolean;
};

export type SpreadAnalysis = {
  facts: SpreadCardFact[];
  patterns: SynthesisPattern[]; // all candidates, sorted by score desc
  primary: SynthesisPattern | null;
  supporting: SynthesisPattern[]; // up to 2
};

// ---------- Tunable thresholds (documented; validated against generated samples) ----------

export const PRIMARY_MIN_CONFIDENCE = 0.5;
export const SUPPORT_MIN_CONFIDENCE = 0.4;

// Priority bonus added to confidence when ranking, encoding the documented
// preference order: diagnosis-remedy > tension > progression > reinforcement >
// focus-concentration. Confidence still matters, so a very strong lower-priority
// pattern can outrank a marginal higher-priority one.
export const PRIORITY_BONUS: Record<PatternKind, number> = {
  "diagnosis-remedy": 0.3,
  tension: 0.25,
  progression: 0.18,
  reinforcement: 0.12,
  "focus-concentration": 0.0,
};

export function patternScore(pattern: SynthesisPattern): number {
  return pattern.confidence + PRIORITY_BONUS[pattern.kind];
}

// ---------- Opposition rules (documented, small, intentional) ----------

// Energy opposition weights. Only different energies oppose; the weight scales
// how strongly. Role category (below) decides whether the opposition is a real
// tension or merely a diagnosis meeting its remedy.
const ENERGY_OPPOSITION: Partial<Record<`${EnergyTag}|${EnergyTag}`, number>> = {
  "push|hold": 1.0, // act vs wait — strongest
  "hold|push": 1.0,
  "hold|release": 0.8, // maintain vs end
  "release|hold": 0.8,
  "push|release": 0.6, // drive forward vs let go
  "release|push": 0.6,
};

// Function opposition: building new vs changing/replacing. assess is neutral.
const FUNCTION_OPPOSITION: Partial<Record<`${FunctionTag}|${FunctionTag}`, number>> = {
  "create|transform": 0.7,
  "transform|create": 0.7,
};

function energyOpposition(a: EnergyTag, b: EnergyTag): number {
  return ENERGY_OPPOSITION[`${a}|${b}`] ?? 0;
}
function functionOpposition(a: FunctionTag, b: FunctionTag): number {
  return FUNCTION_OPPOSITION[`${a}|${b}`] ?? 0;
}

// ---------- Jurisdiction theme tokens ----------

const THEME_STOPWORDS = new Set(["before", "after", "without", "with", "that", "this", "your", "into", "onto", "over"]);

function themeTokens(key: string | null): Set<string> {
  if (!key) return new Set();
  return new Set(key.split("-").filter((token) => token.length >= 4 && !THEME_STOPWORDS.has(token)));
}

function sharedTheme(a: SpreadCardFact, b: SpreadCardFact): string | null {
  const ta = themeTokens(a.jurisdictionKey);
  const tb = themeTokens(b.jurisdictionKey);
  for (const token of Array.from(ta)) {
    if (tb.has(token)) return token;
  }
  return null;
}

// ---------- Helpers ----------

const clamp = (value: number) => Math.max(0, Math.min(1, value));

function richFacts(facts: SpreadCardFact[]): SpreadCardFact[] {
  return facts.filter((fact) => fact.tags !== null);
}

function slugsFor(facts: SpreadCardFact[], indices: number[]): string[] {
  return indices.map((index) => facts[index].slug ?? facts[index].name);
}

// ---------- Detectors ----------

function detectDiagnosisRemedy(facts: SpreadCardFact[]): SynthesisPattern | null {
  const diagnostics = facts.filter((fact) => fact.category === "diagnostic");
  const remedies = facts.filter((fact) => fact.category === "prescriptive");
  if (diagnostics.length === 0 || remedies.length === 0) return null;

  // Choose the most actionable remedy (advice/lever preferred) and the most
  // pointed diagnostic (problem/blocker preferred) to anchor the relationship.
  const remedyRank: Record<PositionRole, number> = {
    advice: 3, lever: 3, keep: 2, resource: 2,
    problem: 0, cause: 0, blocker: 0, cut: 0, trajectory: 0, lesson: 0, insight: 0,
  };
  const diagRank: Record<PositionRole, number> = {
    problem: 3, blocker: 3, cause: 2, cut: 2,
    advice: 0, lever: 0, keep: 0, resource: 0, trajectory: 0, lesson: 0, insight: 0,
  };
  const remedy = [...remedies].sort((a, b) => remedyRank[b.role] - remedyRank[a.role])[0];
  const diagnostic = [...diagnostics].sort((a, b) => diagRank[b.role] - diagRank[a.role])[0];

  let confidence = 0.5;
  const detail: Record<string, string> = {};

  if (remedy.role === "advice" || remedy.role === "lever") confidence += 0.15;
  if (diagnostic.tags && remedy.tags) {
    if (diagnostic.tags.function === "assess" && remedy.tags.function !== "assess") {
      confidence += 0.1; // named the problem, remedy does something about it
      detail.shape = "name-then-act";
    }
    if (diagnostic.tags.focus === remedy.tags.focus) {
      confidence += 0.1; // remedy addresses the same domain the problem lives in
      detail.sharedFocus = diagnostic.tags.focus;
    }
    const theme = sharedTheme(diagnostic, remedy);
    if (theme) {
      confidence += 0.05;
      detail.theme = theme;
    }
  }

  return {
    kind: "diagnosis-remedy",
    confidence: clamp(confidence),
    cardIndices: [...diagnostics, ...remedies].map((fact) => fact.index).sort((a, b) => a - b),
    cardSlugs: slugsFor(facts, [...diagnostics, ...remedies].map((fact) => fact.index).sort((a, b) => a - b)),
    diagnosticIndices: diagnostics.map((fact) => fact.index),
    remedyIndices: remedies.map((fact) => fact.index),
    reason: `${diagnostic.name} (${diagnostic.role}) names the problem; ${remedy.name} (${remedy.role}) supplies a remedy.`,
    detail: { ...detail, anchorDiagnostic: String(diagnostic.index), anchorRemedy: String(remedy.index) },
  };
}

function detectTension(facts: SpreadCardFact[]): SynthesisPattern | null {
  const rich = richFacts(facts);
  let best: SynthesisPattern | null = null;

  for (let i = 0; i < rich.length; i += 1) {
    for (let j = i + 1; j < rich.length; j += 1) {
      const a = rich[i];
      const b = rich[j];
      if (!a.tags || !b.tags) continue;

      const energyOpp = energyOpposition(a.tags.energy, b.tags.energy);
      const functionOpp = functionOpposition(a.tags.function, b.tags.function);
      const opposition = Math.max(energyOpp, functionOpp);
      if (opposition === 0) continue;

      // Category context decides whether the opposition is genuine tension.
      // Two prescriptive cards giving opposing counsel is the strongest case.
      const bothPrescriptive = a.category === "prescriptive" && b.category === "prescriptive";
      const involvesDiagnostic = a.category === "diagnostic" || b.category === "diagnostic";
      let categoryFactor = 0.5; // default: prescriptive + directional/reflective
      if (bothPrescriptive) categoryFactor = 1.0;
      else if (involvesDiagnostic) categoryFactor = 0.25; // prefer diagnosis-remedy instead

      let confidence = opposition * categoryFactor;
      if (energyOpp > 0 && functionOpp > 0) confidence += 0.1;
      confidence = clamp(confidence);

      if (!best || confidence > best.confidence) {
        best = {
          kind: "tension",
          confidence,
          cardIndices: [a.index, b.index],
          cardSlugs: slugsFor(facts, [a.index, b.index]),
          reason: `${a.name} (${a.role}, ${a.tags.energy}) and ${b.name} (${b.role}, ${b.tags.energy}) counsel opposing moves.`,
          detail: {
            axis: energyOpp >= functionOpp ? "energy" : "function",
            bothPrescriptive: String(bothPrescriptive),
          },
        };
      }
    }
  }

  return best;
}

// Ordered role-category arcs that read as a genuine sequence.
const CATEGORY_ARCS: RoleCategory[][] = [
  ["diagnostic", "reflective", "prescriptive"],
  ["diagnostic", "directional", "prescriptive"],
  ["diagnostic", "prescriptive", "directional"],
  ["reflective", "diagnostic", "prescriptive"],
  ["diagnostic", "reflective", "directional"],
];

function arcMatches(categories: RoleCategory[], arc: RoleCategory[]): boolean {
  if (categories.length !== arc.length) return false;
  return categories.every((category, index) => category === arc[index]);
}

function detectProgression(facts: SpreadCardFact[]): SynthesisPattern | null {
  if (facts.length !== 3) return null; // conservative: only 3-card arcs for now
  const ordered = [...facts].sort((a, b) => a.index - b.index);
  const categories = ordered.map((fact) => fact.category);
  if (new Set(categories).size < 2) return null; // all same category is not an arc

  const matchedArc = CATEGORY_ARCS.find((arc) => arcMatches(categories, arc));
  if (!matchedArc) return null;

  let confidence = 0.55;
  const detail: Record<string, string> = { arc: matchedArc.join(" -> ") };

  // Function/energy flow as corroborating evidence.
  const functions = ordered.map((fact) => fact.tags?.function ?? null);
  if (functions.every((fn) => fn !== null) && new Set(functions).size === 3) {
    confidence += 0.15;
    detail.functionFlow = functions.join(" -> ");
  }
  if (ordered.every((fact) => fact.hasRichContent)) confidence += 0.1;

  return {
    kind: "progression",
    confidence: clamp(confidence),
    cardIndices: ordered.map((fact) => fact.index),
    cardSlugs: slugsFor(facts, ordered.map((fact) => fact.index)),
    reason: `Positions move ${matchedArc.join(" -> ")} across the spread.`,
    detail,
  };
}

function detectReinforcement(facts: SpreadCardFact[]): SynthesisPattern | null {
  const rich = richFacts(facts);
  let best: SynthesisPattern | null = null;

  for (let i = 0; i < rich.length; i += 1) {
    for (let j = i + 1; j < rich.length; j += 1) {
      const a = rich[i];
      const b = rich[j];
      if (!a.tags || !b.tags) continue;
      if (a.jurisdictionKey && a.jurisdictionKey === b.jurisdictionKey) continue; // same territory, not two voices

      const sameCategory = a.category === b.category;
      const sameEnergy = a.tags.energy === b.tags.energy;
      const sameFunction = a.tags.function === b.tags.function;
      const theme = sharedTheme(a, b);

      const counselAgreement = sameCategory && sameEnergy && sameFunction;
      const thematic = Boolean(theme);
      if (!counselAgreement && !thematic) continue;

      let confidence: number;
      let agreementType: string;
      if (counselAgreement) {
        confidence = 0.5;
        const compatibleExpression = a.tags.expression === b.tags.expression;
        if (compatibleExpression) confidence += 0.15;
        if (theme) confidence += 0.1;
        agreementType =
          a.category === "diagnostic"
            ? "diagnostic-agreement"
            : a.category === "prescriptive"
              ? "shared-counsel"
              : "aligned";
      } else {
        // Thematic complementarity: same territory, potentially different angles.
        confidence = 0.45;
        if (sameCategory) confidence += 0.1;
        if (sameEnergy || sameFunction) confidence += 0.1;
        agreementType = "thematic-complementary";
      }
      confidence = clamp(confidence);

      if (!best || confidence > best.confidence) {
        best = {
          kind: "reinforcement",
          confidence,
          cardIndices: [a.index, b.index],
          cardSlugs: slugsFor(facts, [a.index, b.index]),
          reason:
            agreementType === "thematic-complementary"
              ? `${a.name} and ${b.name} both center on ${theme}, from different angles.`
              : `${a.name} and ${b.name} give ${agreementType.replace("-", " ")}.`,
          detail: { agreementType, ...(theme ? { theme } : {}) },
        };
      }
    }
  }

  // Extend a counsel-agreement pair to a trio when all three agree.
  if (best && best.detail?.agreementType !== "thematic-complementary" && rich.length >= 3) {
    const [x, y] = best.cardIndices;
    const third = rich.find((fact) => fact.index !== x && fact.index !== y);
    const fx = facts[x];
    const fy = facts[y];
    if (third?.tags && fx.tags && fy.tags) {
      const trio =
        third.category === fx.category &&
        third.tags.energy === fx.tags.energy &&
        third.tags.function === fx.tags.function &&
        third.jurisdictionKey !== fx.jurisdictionKey &&
        third.jurisdictionKey !== fy.jurisdictionKey;
      if (trio) {
        best = {
          ...best,
          confidence: clamp(best.confidence + 0.15),
          cardIndices: [x, y, third.index].sort((a, b) => a - b),
          cardSlugs: slugsFor(facts, [x, y, third.index].sort((a, b) => a - b)),
          reason: `${fx.name}, ${fy.name}, and ${third.name} all pull the same direction.`,
        };
      }
    }
  }

  return best;
}

function detectFocusConcentration(facts: SpreadCardFact[]): SynthesisPattern | null {
  const rich = richFacts(facts);
  if (rich.length < 2) return null;

  const counts = new Map<string, number[]>();
  for (const fact of rich) {
    if (!fact.tags) continue;
    const list = counts.get(fact.tags.focus) ?? [];
    list.push(fact.index);
    counts.set(fact.tags.focus, list);
  }

  let bestFocus: string | null = null;
  let bestIndices: number[] = [];
  for (const [focus, indices] of Array.from(counts.entries())) {
    if (indices.length > bestIndices.length) {
      bestFocus = focus;
      bestIndices = indices;
    }
  }

  // Require a genuine majority (>= 2 of the rich cards and > half).
  if (!bestFocus || bestIndices.length < 2 || bestIndices.length <= rich.length / 2) return null;

  const share = bestIndices.length / rich.length;
  return {
    kind: "focus-concentration",
    confidence: clamp(0.4 + share * 0.4),
    cardIndices: [...bestIndices].sort((a, b) => a - b),
    cardSlugs: slugsFor(facts, [...bestIndices].sort((a, b) => a - b)),
    reason: `${bestIndices.length} of ${rich.length} cards concentrate on ${bestFocus}.`,
    detail: { focus: bestFocus },
    supportingOnly: true,
  };
}

// ---------- Orchestrator ----------

export type AnalyzeSpreadInput = {
  cards: SpreadCardFact[];
  spreadType: string;
  subject: string;
};

export function analyzeSpread({ cards }: AnalyzeSpreadInput): SpreadAnalysis {
  const detectors = [
    detectDiagnosisRemedy,
    detectTension,
    detectProgression,
    detectReinforcement,
    detectFocusConcentration,
  ];

  const patterns = detectors
    .map((detect) => detect(cards))
    .filter((pattern): pattern is SynthesisPattern => pattern !== null)
    .sort((a, b) => patternScore(b) - patternScore(a));

  const primaryCandidates = patterns.filter(
    (pattern) => !pattern.supportingOnly && pattern.confidence >= PRIMARY_MIN_CONFIDENCE,
  );
  const primary = primaryCandidates.length > 0 ? primaryCandidates[0] : null;

  const supporting = patterns
    .filter((pattern) => pattern !== primary && pattern.confidence >= SUPPORT_MIN_CONFIDENCE && pattern.kind !== primary?.kind)
    .slice(0, 2);

  return { facts: cards, patterns, primary, supporting };
}
