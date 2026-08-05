/**
 * Spread synthesis — rendering layer (Phase 3).
 *
 * Pure, deterministic prose generation from the analysis layer's structured
 * facts. Every user-facing claim traces to a real card in the spread. No raw
 * user context, no guaranteed-prediction language. Voice is a sharp, experienced
 * builder — not a mystic, not a productivity coach.
 */

import type { EmotionalRegister } from "@/lib/card-content";
import { hashString } from "@/lib/random";
import type { PositionRole } from "@/lib/position-roles";
import {
  type SpreadAnalysis,
  type SpreadCardFact,
  type SynthesisPattern,
} from "@/lib/synthesis-analyze";

export type SpreadSynthesis = {
  headline: string;
  summary: string;
  priorityAction?: string;
  priorityActionSource?: { cardSlug: string; positionRole: PositionRole };
  primaryPattern: SynthesisPattern | null;
  supportingPatterns: SynthesisPattern[];
  frameId: string;
};

export type RenderSynthesisInput = {
  analysis: SpreadAnalysis;
  spreadType: string;
  subject: string;
  seed: string;
};

// ---------- Small text helpers ----------

function pick<T>(pool: readonly T[], seed: string): T {
  return pool[hashString(seed) % pool.length];
}

function titleCase(text: string): string {
  return text.replace(/\b\w/g, (character) => character.toUpperCase());
}

function shortJurisdiction(fact: SpreadCardFact): string {
  return fact.jurisdiction ?? "its own territory";
}

function ref(fact: SpreadCardFact): string {
  return fact.orientation === "REVERSED" ? `${fact.name} reversed` : fact.name;
}

function factByIndex(facts: SpreadCardFact[], index: number): SpreadCardFact {
  return facts[index];
}

// ---------- Register voice ----------

function dominantRegister(facts: SpreadCardFact[]): EmotionalRegister | null {
  const counts = new Map<EmotionalRegister, number>();
  for (const fact of facts) {
    if (!fact.register) continue;
    counts.set(fact.register, (counts.get(fact.register) ?? 0) + 1);
  }
  let best: EmotionalRegister | null = null;
  let bestCount = 0;
  for (const [register, count] of Array.from(counts.entries())) {
    if (count > bestCount) {
      best = register;
      bestCount = count;
    }
  }
  return best;
}

// Four closers per register (dominant registers were producing a couple of
// conspicuous repeat lines across readings; wider pools + per-reading seeding
// keep any single line from becoming a tell).
const REGISTER_CLOSERS: Record<EmotionalRegister, readonly string[]> = {
  jolt: [
    "Move on the sharpest one first.",
    "Pick one and go.",
    "Start with the card that stings.",
    "Least comfortable move, most useful one.",
  ],
  warmth: [
    "None of this is beyond you.",
    "Start where it feels most doable.",
    "You have carried heavier than this.",
    "Take the kindest first step and go.",
  ],
  gravity: [
    "Treat the honest read as the useful one.",
    "The uncomfortable card is usually the true one.",
    "Do not soften what the cards are naming.",
    "The plain read is the honest one here.",
  ],
  quiet: [
    "Sit with the shape before you act.",
    "There is no rush to resolve all of it at once.",
    "Let the pattern settle before you decide.",
    "Give the quietest position room to speak.",
  ],
};

function registerCloser(facts: SpreadCardFact[], seed: string): string {
  const register = dominantRegister(facts);
  if (!register) return "Read the three positions as one move, not three.";
  return pick(REGISTER_CLOSERS[register], `${seed}:closer`);
}

// ---------- Headline pools ----------

const HEADLINE_POOLS: Record<string, readonly string[]> = {
  "diagnosis-remedy": [
    "The Block Has an Answer",
    "Name It, Then Act",
    "The Fix Is Already Here",
    "Problem Named, Remedy Ready",
    "The Answer Sits Beside the Problem",
    "You Already Hold the Counter",
  ],
  tension: [
    "The Disagreement Is the Point",
    "Two Truths Pulling Apart",
    "Hold Both, Choose Later",
    "The Conflict Is the Signal",
    "Resolve the Order, Not the Fight",
    "Both Are True at Once",
  ],
  progression: [
    "Read It as a Sequence",
    "One Arc, Three Moves",
    "From Problem to Action",
    "The Order Is the Message",
    "Follow the Steps in Turn",
  ],
  reinforcement: [
    "The Cards Point One Way",
    "Agreement Worth Trusting",
    "Same Ground, Different Angles",
    "The Reading Concentrates",
    "One Direction, Worth Trusting",
  ],
  fallback: ["Read These as One", "Three Positions, One Question", "One Question, Several Angles"],
};

function headlineFor(primary: SynthesisPattern | null, facts: SpreadCardFact[], subject: string, seed: string): { headline: string; frameId: string } {
  if (!primary) {
    // A subject-anchored fallback headline stays specific without over-claiming.
    const pool = [...HEADLINE_POOLS.fallback, `Where ${titleCase(subject)} Stands`];
    const index = hashString(`${seed}:headline:fallback`) % pool.length;
    return { headline: pool[index], frameId: `fallback:${index}` };
  }
  // Thematic reinforcement gets a themed headline when a shared theme exists.
  if (primary.kind === "reinforcement" && primary.detail?.theme) {
    const themed = `Centered on ${titleCase(primary.detail.theme)}`;
    return { headline: themed, frameId: `reinforcement:theme` };
  }
  const pool = HEADLINE_POOLS[primary.kind] ?? HEADLINE_POOLS.fallback;
  const index = hashString(`${seed}:headline:${primary.kind}`) % pool.length;
  return { headline: pool[index], frameId: `${primary.kind}:${index}` };
}

// ---------- Supporting-pattern sentence ----------

function supportingSentence(pattern: SynthesisPattern, facts: SpreadCardFact[]): string {
  switch (pattern.kind) {
    case "focus-concentration":
      return `Notice that ${pattern.reason.replace(/\.$/, "")} — the reading locates the issue in one place, not everywhere.`;
    case "reinforcement":
      if (pattern.detail?.agreementType === "thematic-complementary" && pattern.detail.theme) {
        const [a, b] = pattern.cardIndices.map((index) => factByIndex(facts, index));
        return `${ref(a)} and ${ref(b)} both circle ${pattern.detail.theme}, approaching it from different sides.`;
      }
      return `${pattern.cardIndices.map((index) => ref(factByIndex(facts, index))).join(" and ")} lean the same way, which is worth trusting.`;
    case "progression":
      return `There is an order here too: the positions move ${pattern.detail?.arc?.replace(/-/g, "") ?? "in sequence"}.`;
    case "tension":
      return `A quieter tension runs underneath, between ${pattern.cardIndices.map((index) => ref(factByIndex(facts, index))).join(" and ")}.`;
    case "diagnosis-remedy":
      return `There is also a problem-and-answer pairing between the diagnostic and prescriptive cards.`;
    default:
      return "";
  }
}

// ---------- Primary summaries ----------

function otherCardsClause(facts: SpreadCardFact[], usedIndices: number[]): string {
  const others = facts.filter((fact) => !usedIndices.includes(fact.index));
  if (others.length === 0) return "";
  const parts = others.map((fact) => `${ref(fact)} in ${fact.positionLabel} holds ${shortJurisdiction(fact)}`);
  return `${parts.join("; ")}.`;
}

function summarizeDiagnosisRemedy(pattern: SynthesisPattern, facts: SpreadCardFact[], subject: string): { text: string; used: number[] } {
  const diag = factByIndex(facts, Number(pattern.detail?.anchorDiagnostic ?? pattern.diagnosticIndices?.[0] ?? 0));
  const remedy = factByIndex(facts, Number(pattern.detail?.anchorRemedy ?? pattern.remedyIndices?.[0] ?? 0));
  const parts: string[] = [];
  parts.push(
    `Read together, ${subject} has a problem and its answer sitting in the same spread. ${ref(diag)} in ${diag.positionLabel} names where it hurts — ${shortJurisdiction(diag)}.`,
  );
  parts.push(`${ref(remedy)} in ${remedy.positionLabel} is the counter, working through ${shortJurisdiction(remedy)}.`);
  const others = otherCardsClause(facts, [diag.index, remedy.index]);
  if (others) parts.push(others);
  return { text: parts.join(" "), used: [diag.index, remedy.index] };
}

function summarizeTension(pattern: SynthesisPattern, facts: SpreadCardFact[], subject: string): { text: string; used: number[] } {
  const [a, b] = pattern.cardIndices.map((index) => factByIndex(facts, index));
  const parts: string[] = [];
  parts.push(
    `The center of this reading is a real disagreement about ${subject}. ${ref(a)} in ${a.positionLabel} pulls one way — ${shortJurisdiction(a)} — while ${ref(b)} in ${b.positionLabel} pulls the other, toward ${shortJurisdiction(b)}.`,
  );
  parts.push(`You are not being asked to pick a side forever; the contradiction itself is the instruction to resolve which comes first.`);
  const others = otherCardsClause(facts, [a.index, b.index]);
  if (others) parts.push(others);
  return { text: parts.join(" "), used: [a.index, b.index] };
}

function summarizeProgression(pattern: SynthesisPattern, facts: SpreadCardFact[], subject: string): { text: string; used: number[] } {
  const ordered = [...facts].sort((a, b) => a.index - b.index);
  const chain = ordered.map((fact) => `${ref(fact)} (${fact.positionLabel})`).join(" → ");
  const parts: string[] = [];
  parts.push(`These cards read as a sequence about ${subject}, not a list: ${chain}.`);
  parts.push(
    `${ref(ordered[0])} sets the problem, ${ref(ordered[1])} turns it over, and ${ref(ordered[2])} is where it becomes a move. Follow the order rather than jumping to the end.`,
  );
  return { text: parts.join(" "), used: ordered.map((fact) => fact.index) };
}

function summarizeReinforcement(pattern: SynthesisPattern, facts: SpreadCardFact[], subject: string): { text: string; used: number[] } {
  const cards = pattern.cardIndices.map((index) => factByIndex(facts, index));
  const parts: string[] = [];
  if (pattern.detail?.agreementType === "thematic-complementary" && pattern.detail.theme) {
    parts.push(
      `Two of these cards keep ${subject} centered on ${pattern.detail.theme}, from opposite sides: ${ref(cards[0])} in ${cards[0].positionLabel} through ${shortJurisdiction(cards[0])}, and ${ref(cards[1])} in ${cards[1].positionLabel} through ${shortJurisdiction(cards[1])}.`,
    );
  } else {
    const names = cards.map((fact) => `${ref(fact)} (${fact.positionLabel})`).join(", ");
    parts.push(`The spread converges: ${names} point the same direction for ${subject}, which is agreement worth trusting rather than coincidence to discount.`);
  }
  const others = otherCardsClause(facts, cards.map((fact) => fact.index));
  if (others) parts.push(others);
  return { text: parts.join(" "), used: cards.map((fact) => fact.index) };
}

function summarizeFallback(facts: SpreadCardFact[], subject: string): { text: string; used: number[] } {
  const walk = facts
    .map((fact) => `${ref(fact)} in ${fact.positionLabel} looks at ${shortJurisdiction(fact)}`)
    .join("; ");
  const text = `No single pattern dominates this spread, so read the spread position by position and consider how each speaks to ${subject}: ${walk}. Hold the positions side by side rather than forcing one into agreement or conflict with another — the useful reading is in how they relate, not in a single headline.`;
  return { text, used: facts.map((fact) => fact.index) };
}

// ---------- Priority action ----------

const ACTION_ROLE_PREFERENCE: Partial<Record<PositionRole, number>> = {
  advice: 1,
  lever: 2,
  cut: 3,
  blocker: 4,
  keep: 5,
  resource: 6,
};

function selectPriorityAction(
  analysis: SpreadAnalysis,
): { action: string; source: { cardSlug: string; positionRole: PositionRole } } | null {
  const candidates = analysis.facts.filter(
    (fact) => fact.nextAction.trim().length > 0 && ACTION_ROLE_PREFERENCE[fact.role] !== undefined,
  );
  if (candidates.length === 0) return null;

  const byPreference = (list: SpreadCardFact[]) =>
    [...list].sort((a, b) => (ACTION_ROLE_PREFERENCE[a.role] ?? 99) - (ACTION_ROLE_PREFERENCE[b.role] ?? 99))[0];

  let chosen: SpreadCardFact | undefined;
  const primary = analysis.primary;

  if (primary?.kind === "diagnosis-remedy" && primary.remedyIndices) {
    const remedyCandidates = candidates.filter((fact) => primary.remedyIndices!.includes(fact.index));
    chosen = byPreference(remedyCandidates.length > 0 ? remedyCandidates : candidates);
  } else if (primary?.kind === "progression") {
    // The last actionable step in the arc.
    chosen = [...candidates].sort((a, b) => b.index - a.index)[0];
  } else {
    chosen = byPreference(candidates);
  }

  if (!chosen) return null;
  return {
    action: chosen.nextAction,
    source: { cardSlug: chosen.slug ?? chosen.name, positionRole: chosen.role },
  };
}

// ---------- Orchestrator ----------

export function renderSpreadSynthesis({ analysis, subject, seed }: RenderSynthesisInput): SpreadSynthesis {
  const { facts, primary, supporting } = analysis;
  const { headline, frameId } = headlineFor(primary, facts, subject, seed);

  let body: { text: string; used: number[] };
  switch (primary?.kind) {
    case "diagnosis-remedy":
      body = summarizeDiagnosisRemedy(primary, facts, subject);
      break;
    case "tension":
      body = summarizeTension(primary, facts, subject);
      break;
    case "progression":
      body = summarizeProgression(primary, facts, subject);
      break;
    case "reinforcement":
      body = summarizeReinforcement(primary, facts, subject);
      break;
    default:
      body = summarizeFallback(facts, subject);
  }

  const sentences = [body.text];
  const supportSentence = supporting[0] ? supportingSentence(supporting[0], facts) : "";
  if (supportSentence) sentences.push(supportSentence);
  sentences.push(registerCloser(facts, seed));

  const summary = sentences.filter(Boolean).join(" ");

  // A reflective spread (no actionable card) shows no priority action.
  const priority = selectPriorityAction(analysis);

  return {
    headline,
    summary,
    priorityAction: priority?.action,
    priorityActionSource: priority?.source,
    primaryPattern: primary,
    supportingPatterns: supporting,
    frameId,
  };
}
