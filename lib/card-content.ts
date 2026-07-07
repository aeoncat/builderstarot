/**
 * Rich card content for Builder's Tarot (Phase 1 foundation).
 *
 * NOT wired into runtime yet. `lib/card-deck.ts` remains the live source of
 * truth for the seed and reading output until Phase 2. Cards are keyed by a
 * stable `slug`; `name` must match `card-deck.ts` exactly, since the database
 * still joins on name until the Phase 3 slug migration.
 */

export const CARD_CONTENT_VERSION = 1;

// ---------- Synthesis vocabulary ----------
// Tags describe what the orientation ASKS OF THE READER (its counsel), not
// what the card depicts. Two cards "agree" when they counsel the same move,
// which is what reinforcement/tension detection composes over.

export const ENERGY_TAGS = ["push", "hold", "release"] as const;
export const FOCUS_TAGS = ["self", "work", "relationships"] as const;
export const FUNCTION_TAGS = ["create", "assess", "transform"] as const;
// How the card's core energy is expressing itself in this orientation.
// Upright and reversed may share energy/focus/function when semantically
// correct, but should normally differ in expression.
// "released" covers redemptive reversals (e.g. The Trap) where the shadow
// lifts rather than deepens — a legitimate reversed expression, not a darker one.
export const EXPRESSION_TAGS = ["clear", "blocked", "excessive", "distorted", "avoided", "released"] as const;

export type EnergyTag = (typeof ENERGY_TAGS)[number];
export type FocusTag = (typeof FOCUS_TAGS)[number];
export type FunctionTag = (typeof FUNCTION_TAGS)[number];
export type ExpressionTag = (typeof EXPRESSION_TAGS)[number];

export type SynthesisTags = {
  readonly energy: EnergyTag;
  readonly focus: FocusTag;
  readonly function: FunctionTag;
  readonly expression: ExpressionTag;
};

// ---------- Emotional register ----------

export const REGISTERS = ["jolt", "warmth", "gravity", "quiet"] as const;
export type EmotionalRegister = (typeof REGISTERS)[number];

// ---------- Classical correspondence ----------
// Preserves the deck's conceptual spine: each Builder's Tarot major maps to a
// classical Major Arcana card. `numeral` is the classical trump number (0-21).

export type ClassicalCorrespondence = {
  readonly name: string;
  readonly numeral: number;
};

// ---------- Per-orientation content ----------

export type OrientationContent = {
  /**
   * The card's voice for this orientation. Editorial guideline: 2-3 sentences
   * including one concrete builder-world image. Enforced by character-length
   * bounds (see card-content-validation.ts), not sentence counting.
   */
  readonly meaning: string;
  /** The conflict this orientation names. Lowercase clause; must be able to
   *  complete framings like "The tension here is ...". */
  readonly tension: string;
  /** One imperative, concretely doable sentence. */
  readonly advice: string;
  /** What it looks like when this card's message is ignored or distorted.
   *  Lowercase clause; must be able to complete "If nothing changes, ...". */
  readonly warning: string;
  /** 1-2 orientation-specific reflection questions. */
  readonly questions: readonly [string] | readonly [string, string];
  /** Emotional register for this orientation (orientation-aware by design:
   *  e.g. The Outage is a jolt upright, but its avoided reversal is gravity). */
  readonly register: EmotionalRegister;
  readonly tags: SynthesisTags;
};

// ---------- The card ----------

export type CardContent = {
  /** Stable machine identity (kebab-case). Survives display renames; becomes
   *  the DB join key in Phase 3. */
  readonly slug: string;
  /** Must match the `name` in card-deck.ts exactly until the slug migration. */
  readonly name: string;
  readonly arcana: "MAJOR";
  /** Machine-readable jurisdiction key (kebab-case, unique across the deck).
   *  Used for validation and synthesis. */
  readonly jurisdictionKey: string;
  /** Human-readable prose naming the territory only this card owns. */
  readonly jurisdiction: string;
  readonly classical: ClassicalCorrespondence;
  readonly keywords: readonly [string, string, string];
  readonly upright: OrientationContent;
  readonly reversed: OrientationContent;
  readonly contentVersion: number;
  readonly imageUrl?: string | null;
};

// ---------- Authoring source ----------
// The readonly array is the single authoring source; the slug union, lookup
// map, and name->slug bridge are all derived from it below.

export const CARD_CONTENTS = [
  {
    slug: "the-builder",
    name: "The Builder",
    arcana: "MAJOR",
    jurisdictionKey: "capability",
    jurisdiction: "the capability already on your bench",
    classical: { name: "The Magician", numeral: 1 },
    keywords: ["craft", "agency", "execution"],
    contentVersion: CARD_CONTENT_VERSION,
    upright: {
      meaning:
        "You are not waiting on a missing tool — everything on the bench is enough to make the next real thing. The gap between the idea and the artifact closes through your hands, at whatever fidelity you can reach today. Capability compounds when it is used; make something exist by tonight.",
      tension: "believing the work needs one more skill, tool, or permission before it can begin",
      advice:
        "Choose the smallest artifact you could finish today with only the skills you already have, and finish it.",
      warning:
        "the idea will stay theoretical while your confidence quietly erodes, and someone with fewer skills and less taste will ship it first",
      questions: [
        "What can I build with only what is already on my bench?",
        "Where am I treating preparation as progress?",
      ],
      register: "warmth",
      tags: { energy: "push", focus: "self", function: "create", expression: "clear" },
    },
    reversed: {
      meaning:
        "The capability is real, but it is spread across five half-open projects and none of them is getting enough of you to become anything. Skill without a single point of application behaves exactly like no skill at all. This is not a talent problem; it is a focus debt.",
      tension: "the fear that choosing one project means the others were wasted",
      advice:
        "Rank your open projects by honest pull, freeze all but the top one for thirty days, and write the freeze down where you will see it.",
      warning:
        "another season will pass with impressive activity and no finished artifact, and the scattering will start to look like who you are",
      questions: ["If I could only finish one of these, which would I mourn least losing the others for?"],
      register: "quiet",
      tags: { energy: "hold", focus: "work", function: "assess", expression: "blocked" },
    },
  },
  {
    slug: "the-co-founder",
    name: "The Co-Founder",
    arcana: "MAJOR",
    jurisdictionKey: "working-alignment",
    jurisdiction: "alignment and unspoken terms in working relationships",
    classical: { name: "The Lovers", numeral: 6 },
    keywords: ["alignment", "choice", "trust"],
    contentVersion: CARD_CONTENT_VERSION,
    upright: {
      meaning:
        "The work is at a scale where alignment is itself an asset: the right partner, client, or collaborator does not just add hands, they sharpen what the mission means. Commitment here is a choice made in the open, with the terms said out loud. Choose the relationship the way you would choose an architecture — for how it fails, not just how it demos.",
      tension: "wanting the benefits of deep collaboration while keeping every commitment revocable",
      advice:
        "Put the implicit terms of your most important working relationship in writing this week — who decides what, who owns what, and what happens if it ends.",
      warning:
        "the ambiguity you are both being polite about will calcify into resentment, and it will surface at the worst possible moment — under load",
      questions: [
        "What have we each agreed to that we have never actually said?",
        "Would I choose this working relationship again today, knowing what I know?",
      ],
      register: "warmth",
      tags: { energy: "push", focus: "relationships", function: "create", expression: "clear" },
    },
    reversed: {
      meaning:
        "Something unsaid is dragging under the hull of a working relationship — an expectation one of you believes was promised and the other never heard. The collaboration still functions, which is exactly why the drift is easy to ignore. Unspoken terms do not stay neutral; they compound like interest.",
      tension: "protecting today's comfort in the relationship at the cost of its actual foundation",
      advice:
        "Open the conversation you have been drafting in your head: name one expectation you have been carrying silently, and ask what they have been carrying.",
      warning:
        "the gap will be discovered instead of disclosed — during a crunch, a payout, or a departure — and by then it will read as betrayal rather than misunderstanding",
      questions: ["What am I hoping they will figure out without me saying it?"],
      register: "gravity",
      tags: { energy: "release", focus: "relationships", function: "transform", expression: "avoided" },
    },
  },
  {
    slug: "the-sprint",
    name: "The Sprint",
    arcana: "MAJOR",
    jurisdictionKey: "time-pressure",
    jurisdiction: "time pressure as a forcing function",
    classical: { name: "The Chariot", numeral: 7 },
    keywords: ["momentum", "deadline", "focus"],
    contentVersion: CARD_CONTENT_VERSION,
    upright: {
      meaning:
        "This is the card of the timeboxed bet: pick the one question your project keeps asking and answer it in days, not quarters. A sprint is not speed — it is the discipline of declaring what you will not do this week. The deadline is doing you a favor: it makes the argument with yourself end.",
      tension: "wanting certainty before you move, when only movement produces the certainty",
      advice:
        "Name the single outcome that would settle your biggest open question, set a date inside two weeks, and cut everything that does not serve it.",
      warning:
        "the open question stays open, the scope keeps breathing, and in a month you will have worked hard without being able to say what you learned",
      questions: [
        "What outcome would let me stop debating with myself?",
        "What am I pretending is essential to this push?",
      ],
      register: "jolt",
      tags: { energy: "push", focus: "work", function: "create", expression: "clear" },
    },
    reversed: {
      meaning:
        "Motion has replaced direction. The commits are landing, the board is moving, and none of it is answering the question that actually matters — a sprint with no finish line is just running. Busy is the most comfortable way to avoid deciding.",
      tension: "the comfort of visible activity versus the discomfort of asking whether it is aimed at anything",
      advice:
        "Stop and write down what this week's work is supposed to prove; if you cannot, cancel the sprint and spend one hour choosing the question before resuming.",
      warning:
        "you will hit the deadline exhausted, ship the wrong increment, and mistake the fatigue for evidence that you are on track",
      questions: ["If this sprint succeeds completely, what will I know that I do not know now?"],
      register: "quiet",
      tags: { energy: "hold", focus: "work", function: "assess", expression: "distorted" },
    },
  },
  {
    slug: "the-pause",
    name: "The Pause",
    arcana: "MAJOR",
    jurisdictionKey: "deliberate-suspension",
    jurisdiction: "deliberate suspension that changes the view",
    classical: { name: "The Hanged Man", numeral: 12 },
    keywords: ["reframe", "patience", "constraint"],
    contentVersion: CARD_CONTENT_VERSION,
    upright: {
      meaning:
        "Nothing is blocked — you are being asked to stop pushing on purpose. Some problems only show their shape when you hang upside down for a while: reread the issue thread cold, sit with the design without your hands on the keyboard. The move you cannot see from inside the effort is visible from outside it.",
      tension: "the urge to force progress versus the possibility that effort itself is what is hiding the answer",
      advice:
        "Schedule a real stop — a day off this problem, not a slower version of working on it — and do not return until something about it looks different.",
      warning:
        "you will keep solving the version of the problem you first imagined, and the elegant reframe will go to whoever stepped back first",
      questions: [
        "What does this look like from the perspective I have been refusing?",
        "What would I notice if I were not mid-push?",
      ],
      register: "quiet",
      tags: { energy: "hold", focus: "self", function: "assess", expression: "clear" },
    },
    reversed: {
      meaning:
        "The pause has quietly become the plan. What began as patience is now a way to avoid a decision that was ready weeks ago — waiting feels wise, but nothing new is arriving to wait for. Suspension only works when something is suspended; this is just the decision, postponed.",
      tension: "calling it patience when the missing ingredient is not information but nerve",
      advice:
        "Write the decision you would make today if you had to, then name the specific new fact you are waiting for — if you cannot name one, the decision is already made and needs saying out loud.",
      warning:
        "the option you are protecting by not choosing will expire on its own schedule, and you will inherit the outcome without the authorship",
      questions: ["What am I actually waiting for — and would I recognize it if it arrived?"],
      register: "gravity",
      tags: { energy: "push", focus: "self", function: "transform", expression: "excessive" },
    },
  },
  {
    slug: "the-outage",
    name: "The Outage",
    arcana: "MAJOR",
    jurisdictionKey: "failure-exposure",
    jurisdiction: "the moment of failure and what it exposes",
    classical: { name: "The Tower", numeral: 16 },
    keywords: ["crisis", "truth", "exposure"],
    contentVersion: CARD_CONTENT_VERSION,
    upright: {
      meaning:
        "Something just broke, and the breakage is the most honest document your project has ever produced. The failure did not create the fragility — it revealed where the fragility always was: the untested path, the single point of failure, the assumption nobody wrote down. This is expensive information; do not waste it.",
      tension:
        "the instinct to restore normal as fast as possible versus the once-only chance to see the system with its walls down",
      advice:
        "Stabilize first, then write down — within 48 hours, while it is vivid — exactly what the failure exposed, before the story softens.",
      warning:
        "the same class of failure will return wearing different clothes, and next time it will find you with more users and less goodwill",
      questions: [
        "What did the breakage prove that I was told, or telling myself, was fine?",
        "What fix would prevent this class of failure, not just this instance?",
      ],
      register: "jolt",
      tags: { energy: "hold", focus: "work", function: "assess", expression: "clear" },
    },
    reversed: {
      meaning:
        "The incident is over but the reckoning never happened — the postmortem got scheduled, softened, or skipped, and the fragile thing is quietly back in production. Avoiding the autopsy does not keep the failure dead. Somewhere the same weak joint is bearing load again.",
      tension: "protecting morale or ego today at the price of guaranteeing a rerun",
      advice:
        "Hold the blameless postmortem you skipped, even weeks late, and leave the room with one structural change — not a promise to be more careful.",
      warning:
        "the second outage will look eerily like the first, and this time the surprising part will not be the failure — it will be that you knew",
      questions: ["What conversation about this failure am I steering around?"],
      register: "gravity",
      tags: { energy: "release", focus: "work", function: "transform", expression: "avoided" },
    },
  },
  {
    slug: "the-fog",
    name: "The Fog",
    arcana: "MAJOR",
    jurisdictionKey: "absence-of-evidence",
    jurisdiction: "the territory where the map ends",
    classical: { name: "The Moon", numeral: 18 },
    keywords: ["uncertainty", "fear", "unknown"],
    contentVersion: CARD_CONTENT_VERSION,
    upright: {
      meaning:
        "You are moving through territory where the map simply ends — not because you failed to research, but because no one has the data yet. In fog you do not navigate by vision; you navigate by probes: small, cheap moves that report back. Treat every assumption as a hypothesis with a due date.",
      tension: "needing to act at exactly the moment when acting blind feels irresponsible",
      advice:
        "Write down your three riskiest assumptions and design the cheapest possible test for the scariest one this week.",
      warning:
        "you will either freeze at the fog's edge or stride into it on pure assumption — and both end with the unknown deciding for you",
      questions: [
        "Which of my assumptions would hurt most if it turned out to be wrong?",
        "What is the cheapest experiment that would let me see one step further?",
      ],
      register: "quiet",
      tags: { energy: "hold", focus: "work", function: "assess", expression: "clear" },
    },
    reversed: {
      meaning:
        "The fog here is manufactured: the information exists — in an analytics dashboard, in a user's inbox, in a conversation you keep not having — and fear has been writing fiction in its place. Every day the gap stays unexamined, the imagined version grows scarier than the real one. Dread is not data.",
      tension: "preferring a frightening story you control to a real answer you do not",
      advice:
        "Name the question you have been afraid to ask, then get the actual answer within 48 hours — send the email, run the query, make the call.",
      warning:
        "you will keep steering around an obstacle that may not exist, and the detours will quietly become the architecture of the project",
      questions: ["What do I already have the means to find out and keep choosing not to?"],
      register: "gravity",
      tags: { energy: "push", focus: "self", function: "assess", expression: "distorted" },
    },
  },
  {
    slug: "the-spark",
    name: "The Spark",
    arcana: "MAJOR",
    jurisdictionKey: "ignition-before-certainty",
    jurisdiction: "the first move made before certainty arrives",
    classical: { name: "The Fool", numeral: 0 },
    keywords: ["beginning", "risk", "permission"],
    contentVersion: CARD_CONTENT_VERSION,
    upright: {
      meaning:
        "An idea has enough charge to move, and it is asking you to act before the plan is complete. The Spark is not recklessness; it is the willingness to make the first small, real thing while the outcome is still unknown. Certainty does not precede the leap — it is manufactured by it.",
      tension: "wanting proof the idea will work before doing the one thing that would produce the proof",
      advice:
        "Take the smallest irreversible step today — publish the repo, send the message, buy the domain — so the idea exists outside your head.",
      warning:
        "the charge fades, the moment passes to someone bolder, and the idea joins the quiet pile of things you almost started",
      questions: [
        "What is the smallest first step that would make this real?",
        "What permission am I still waiting for, and from whom?",
      ],
      register: "jolt",
      tags: { energy: "push", focus: "work", function: "create", expression: "clear" },
    },
    reversed: {
      meaning:
        "Waiting for perfect conditions has quietly become a way of saying no. The runway is never long enough, the timing never quite right, and each sensible delay is spending the energy the idea started with. Readiness is not a milestone you reach; it is a decision you make.",
      tension: "mistaking the search for the perfect starting moment for responsible preparation",
      advice: "Name the condition you claim you are waiting for, then start this week as if it were already met.",
      warning: "the idea stays theoretical indefinitely, and the habit of not-yet hardens into a way of living",
      questions: ["What am I calling 'not ready' that is actually 'not willing'?"],
      register: "quiet",
      tags: { energy: "hold", focus: "self", function: "create", expression: "blocked" },
    },
  },
  {
    slug: "the-signal",
    name: "The Signal",
    arcana: "MAJOR",
    jurisdictionKey: "incoming-evidence",
    jurisdiction: "the faint true signal inside the noise",
    classical: { name: "The High Priestess", numeral: 2 },
    keywords: ["insight", "intuition", "market"],
    contentVersion: CARD_CONTENT_VERSION,
    upright: {
      meaning:
        "Somewhere in the feedback, the analytics, and your own quiet unease, a real signal keeps repeating. The Signal rewards listening over broadcasting: the opportunity is already speaking, in the feature people keep asking for or the workaround they keep building. Attune before you act.",
      tension: "the pull to keep shipping and talking when the useful move is to go quiet and listen",
      advice:
        "Collect the last ten pieces of unsolicited feedback and look for the one pattern that appears in more than half of them.",
      warning:
        "you keep answering questions no one is asking while the real opportunity repeats itself, unheard, to someone else",
      questions: [
        "What signal keeps repeating that I have been too busy to hear?",
        "Where is the demand already showing itself?",
      ],
      register: "quiet",
      tags: { energy: "hold", focus: "work", function: "assess", expression: "clear" },
    },
    reversed: {
      meaning:
        "The dial is picking up noise and calling it signal. Vanity metrics, the loudest customer, and other people's urgency are crowding out the quieter truth, and you are optimizing for numbers that flatter rather than inform. Not everything that spikes is meaningful.",
      tension: "trusting the metric that is easy to measure over the truth that is hard to hear",
      advice:
        "Pick the one number you have been steering by and ask what decision it has actually changed; if none, stop watching it.",
      warning: "you chase a flattering chart off a cliff, arriving at a number that looks like success and feels like nothing",
      questions: ["Which metric am I watching because it is comforting rather than because it is true?"],
      register: "gravity",
      tags: { energy: "hold", focus: "work", function: "assess", expression: "distorted" },
    },
  },
  {
    slug: "the-studio",
    name: "The Studio",
    arcana: "MAJOR",
    jurisdictionKey: "creative-conditions",
    jurisdiction: "the conditions that let good work emerge",
    classical: { name: "The Empress", numeral: 3 },
    keywords: ["nurture", "environment", "creative supply"],
    contentVersion: CARD_CONTENT_VERSION,
    upright: {
      meaning:
        "Your best work is downstream of the conditions you make for it. The Studio is the card of tending the environment — the protected hours, the replenished inputs, the room that invites making rather than draining it. Feed the source and the output takes care of itself.",
      tension: "treating creative output as pure willpower while neglecting the conditions that actually produce it",
      advice:
        "Improve one input this week — sleep, a cleared desk, a refilled well of reading or rest — and protect it like a deadline.",
      warning: "you keep demanding output from a depleted source until the work turns thin and the making stops feeling like yours",
      questions: ["What conditions are present when my best work appears?", "What input have I let run dry?"],
      register: "warmth",
      tags: { energy: "hold", focus: "self", function: "create", expression: "clear" },
    },
    reversed: {
      meaning:
        "The environment is quietly eating the work before it can mature. A fractured calendar, a draining room, or a culture of interruption is taxing every hour, and no amount of discipline fully offsets a setting that works against you. The problem is not your effort; it is the soil.",
      tension: "blaming your own discipline for a shortfall the environment is actually causing",
      advice: "Identify the single biggest drain in your working environment and change it structurally, not through willpower.",
      warning: "you burn scarce energy fighting your surroundings, and mistake the exhaustion for a lack of talent",
      questions: ["What part of my environment is taxing every hour before I even begin?"],
      register: "quiet",
      tags: { energy: "hold", focus: "self", function: "create", expression: "blocked" },
    },
  },
  {
    slug: "the-architect",
    name: "The Architect",
    arcana: "MAJOR",
    jurisdictionKey: "structural-blueprint",
    jurisdiction: "the blueprint that turns ambition into a system",
    classical: { name: "The Emperor", numeral: 4 },
    keywords: ["structure", "systems", "blueprint"],
    contentVersion: CARD_CONTENT_VERSION,
    upright: {
      meaning:
        "Ambition without structure leaks. The Architect draws the load-bearing lines — the schema, the org, the plan that lets effort compound instead of scattering. A good structure is invisible when it works: it simply makes the next right move the easy one.",
      tension: "the urge to keep improvising when what the work now needs is a deliberate frame",
      advice:
        "Draw the one diagram that names your system's core parts and how they connect, and let it decide the next disputed choice.",
      warning:
        "the project keeps reinventing itself with every task, and the same decisions get relitigated until momentum bleeds out",
      questions: ["What structure would make the next ten decisions easier?", "Where is improvisation costing more than it saves?"],
      register: "quiet",
      tags: { energy: "push", focus: "work", function: "create", expression: "clear" },
    },
    reversed: {
      meaning:
        "The blueprint has swallowed the building. Over-design, premature abstraction, or a diagram nobody owns is now producing more structure than the work can use. Architecture is meant to serve making, not replace it — and right now the scaffolding outweighs the thing being built.",
      tension: "polishing the plan as a sophisticated way of postponing the work",
      advice:
        "Cut the structure back to what today's actual task requires, and delete or defer every abstraction you cannot point to a present use for.",
      warning: "you end up with an elegant framework around an empty center, having built the map instead of the territory",
      questions: ["What part of this structure exists for a problem I do not yet have?"],
      register: "quiet",
      tags: { energy: "hold", focus: "work", function: "create", expression: "excessive" },
    },
  },
  {
    slug: "the-mentor",
    name: "The Mentor",
    arcana: "MAJOR",
    jurisdictionKey: "inherited-wisdom",
    jurisdiction: "the lesson you can inherit instead of paying for",
    classical: { name: "The Hierophant", numeral: 5 },
    keywords: ["wisdom", "standards", "lineage"],
    contentVersion: CARD_CONTENT_VERSION,
    upright: {
      meaning:
        "Someone has already paid the tuition for a lesson you are about to buy. The Mentor is the card of lineage — the practice, standard, or hard-won judgment you can adopt rather than rediscover. Standing on that shoulder is not weakness; it is how craft actually accumulates.",
      tension: "the pride that would rather earn a lesson expensively than receive it freely",
      advice:
        "Find the person or text that has already solved a version of your problem, and borrow their standard before inventing your own.",
      warning: "you spend months rediscovering what a single conversation could have taught you, and call the detour experience",
      questions: [
        "Who has already solved a version of this, and have I actually asked them?",
        "What standard am I ready to inherit?",
      ],
      register: "warmth",
      tags: { energy: "hold", focus: "relationships", function: "assess", expression: "clear" },
    },
    reversed: {
      meaning:
        "Pride or isolation is keeping the door shut. Helpful guidance is available — a mentor, a community, a manual — and something in you would rather struggle alone than be seen needing it. Refusing the shoulder does not make the climb nobler; it just makes it slower.",
      tension: "protecting your self-image as the one who figures it out alone at the cost of the help within reach",
      advice:
        "Ask one specific question of one person who knows more than you this week, and let the answer land without defending your first approach.",
      warning: "you relearn avoidable lessons the hard way while the people who could have shortened the path drift out of reach",
      questions: ["Whose help am I avoiding because accepting it would dent how I see myself?"],
      register: "gravity",
      tags: { energy: "hold", focus: "relationships", function: "assess", expression: "avoided" },
    },
  },
  {
    slug: "the-operator",
    name: "The Operator",
    arcana: "MAJOR",
    jurisdictionKey: "operational-repeatability",
    jurisdiction: "the operating rhythm that runs without heroics",
    classical: { name: "Strength", numeral: 8 },
    keywords: ["discipline", "ops", "reliability"],
    contentVersion: CARD_CONTENT_VERSION,
    upright: {
      meaning:
        "The magic of a reliable system is that it stops needing you to be exceptional. The Operator turns a working idea into a dependable rhythm — the checklist, the cadence, the boring process that makes good outcomes the default. Quiet consistency compounds louder than any single heroic day.",
      tension: "the appeal of the dramatic rescue versus the unglamorous discipline that removes the need for one",
      advice:
        "Take the thing you keep pulling off by force of will and turn it into a written, repeatable routine this week.",
      warning: "the work stays hostage to your personal effort, and every good result remains one bad day away from collapse",
      questions: ["What good outcome still depends on me being at my best?", "What deserves a reliable rhythm instead of a rescue?"],
      register: "quiet",
      tags: { energy: "hold", focus: "work", function: "create", expression: "clear" },
    },
    reversed: {
      meaning:
        "The whole operation is running on heroics, and the heroics are running on you. What looks like dedication is actually a missing process — a system that only survives because someone keeps sprinting to patch it. Adrenaline is a stimulant, not a foundation.",
      tension: "wearing constant rescue as a badge of commitment while it quietly guarantees burnout",
      advice:
        "Pick the fire you fight most often and spend one block building the process that would stop it recurring, instead of fighting it again.",
      warning: "you become the single point of failure you were protecting against, and the system fails the moment you finally rest",
      questions: ["What am I holding together by force that should be held together by design?"],
      register: "jolt",
      tags: { energy: "push", focus: "self", function: "transform", expression: "excessive" },
    },
  },
  {
    slug: "the-deep-work",
    name: "The Deep Work",
    arcana: "MAJOR",
    jurisdictionKey: "protected-attention",
    jurisdiction: "the protected attention a hard problem demands",
    classical: { name: "The Hermit", numeral: 9 },
    keywords: ["solitude", "research", "focus"],
    contentVersion: CARD_CONTENT_VERSION,
    upright: {
      meaning:
        "Some problems only yield to uninterrupted attention, and this is one of them. The Deep Work asks you to withdraw from the pings and the meetings and give the hard question the long, unbroken block it actually requires. Depth is not found in more inputs; it is found in fewer.",
      tension: "the comfort of shallow busyness versus the discomfort of sitting alone with the real problem",
      advice: "Block three uninterrupted hours this week, put the hard question at the center of them, and let nothing else in.",
      warning: "the real problem stays fuzzy because you keep meeting it in fragments, and the fragments never add up to an answer",
      questions: [
        "What deserves a protected block of my deepest attention?",
        "What would become clear if I stopped consulting everyone but myself?",
      ],
      register: "quiet",
      tags: { energy: "hold", focus: "self", function: "assess", expression: "clear" },
    },
    reversed: {
      meaning:
        "Busyness has become the hiding place. The calendar is full, the notifications are handled, and none of it is touching the one problem that actually matters — because staying in motion is how you avoid the silence where it lives. Activity is the most respectable form of avoidance.",
      tension: "using a full schedule to avoid the solitary confrontation the problem requires",
      advice: "Name the problem you are outrunning, cancel something today, and spend the reclaimed time alone with it and nothing else.",
      warning: "you stay comfortably busy for months while the thing that needed depth quietly rots at the center of the project",
      questions: ["What am I avoiding by keeping myself this busy?"],
      register: "gravity",
      tags: { energy: "push", focus: "self", function: "assess", expression: "avoided" },
    },
  },
  {
    slug: "the-pivot",
    name: "The Pivot",
    arcana: "MAJOR",
    jurisdictionKey: "adaptive-timing",
    jurisdiction: "reading the turn of the cycle and adapting to it",
    classical: { name: "Wheel of Fortune", numeral: 10 },
    keywords: ["timing", "cycle", "adaptation"],
    contentVersion: CARD_CONTENT_VERSION,
    upright: {
      meaning:
        "The wheel has turned and the ground you planned for is no longer the ground you stand on. The Pivot is not failure; it is the discipline of updating on new evidence instead of defending an old bet out of loyalty. Adapt to the cycle you are actually in, not the one you forecast.",
      tension: "loyalty to the plan you committed to versus honesty about the evidence in front of you",
      advice: "Write down what has changed since you set the current direction, and let that list — not sunk cost — choose the next move.",
      warning: "you keep executing a strategy for a moment that has already passed, and the market moves on without you",
      questions: ["What new information would change my plan if I let it?", "What am I defending out of loyalty rather than logic?"],
      register: "jolt",
      tags: { energy: "push", focus: "work", function: "transform", expression: "clear" },
    },
    reversed: {
      meaning:
        "You can see the turn coming and you are bracing against it anyway. Sunk cost has become identity: too much time, money, or pride is invested to let the old direction go, so you keep pouring in more. The wheel does not care how much you have already spent.",
      tension: "letting what you have already invested dictate what you invest next",
      advice: "Ask what you would choose if you were arriving fresh today with no history here, and take one step toward that answer.",
      warning: "you throw good effort after a dead direction until the cost of changing feels impossible and the choice gets made for you",
      questions: ["What am I refusing to write off, and what is that refusal costing me now?"],
      register: "gravity",
      tags: { energy: "hold", focus: "self", function: "transform", expression: "blocked" },
    },
  },
  {
    slug: "the-standard",
    name: "The Standard",
    arcana: "MAJOR",
    jurisdictionKey: "quality-judgment",
    jurisdiction: "the quality bar that earns trust over time",
    classical: { name: "Justice", numeral: 11 },
    keywords: ["quality", "ethics", "judgment"],
    contentVersion: CARD_CONTENT_VERSION,
    upright: {
      meaning:
        "Trust is built one honored standard at a time. The Standard is the card of the bar you hold when no one is checking — the test you write, the corner you refuse to cut, the fairness you extend to your users and your future self. Quality is a promise paid forward.",
      tension: "the short-term relief of lowering the bar against the long-term trust that only holding it can build",
      advice: "Name the one quality standard this work must not violate, and make it a visible, non-negotiable line for this release.",
      warning:
        "small compromises accrue quietly into a reputation, and the trust you spent years building leaks out through the corners you cut",
      questions: ["What quality bar actually matters here, and am I holding it?", "What would I be uneasy defending later?"],
      register: "gravity",
      tags: { energy: "hold", focus: "work", function: "assess", expression: "clear" },
    },
    reversed: {
      meaning:
        "A tempting shortcut is offering to solve today by borrowing against tomorrow. The Standard reversed is the compromised judgment that ships the thing you will have to defend, apologize for, or rebuild — a debt taken in quality that always comes due with interest. Cheap now, expensive later.",
      tension: "the pressure to ship at any cost overriding the judgment that knows better",
      advice:
        "Before taking the shortcut, write the sentence you would have to say when it fails; if you would not want to say it, do not take it.",
      warning: "the corner you cut becomes the incident you explain, and the time you saved is repaid several times over in trust and rework",
      questions: ["What shortcut am I about to take that I would be ashamed to defend out loud?"],
      register: "gravity",
      tags: { energy: "push", focus: "work", function: "assess", expression: "distorted" },
    },
  },
  {
    slug: "the-sunset",
    name: "The Sunset",
    arcana: "MAJOR",
    jurisdictionKey: "clean-ending",
    jurisdiction: "ending the right thing to free its energy",
    classical: { name: "Death", numeral: 13 },
    keywords: ["ending", "release", "transition"],
    contentVersion: CARD_CONTENT_VERSION,
    upright: {
      meaning:
        "Something has run its course, and ending it cleanly is the most generative move available. The Sunset is not defeat — it is the deliberate close that frees the energy, attention, and identity a finished thing was still quietly consuming. What you end well makes room for what comes next.",
      tension: "grieving the loss of what is ending versus recognizing the energy its ending would return to you",
      advice: "Choose the one project, feature, or commitment that is quietly over, and give it a real ending this week rather than a slow fade.",
      warning: "the thing that is already over keeps drawing your energy indefinitely, and the next version of the work never gets room to begin",
      questions: ["What needs to be ended cleanly instead of left to fade?", "What energy would return to me if I let it go?"],
      register: "gravity",
      tags: { energy: "release", focus: "work", function: "transform", expression: "clear" },
    },
    reversed: {
      meaning:
        "You are holding the door open for something that has already left. Attachment to a past bet — a beloved feature, an old identity, a project you were proud of — is blocking the renewal that its ending would allow. Keeping the corpse warm does not bring it back; it only delays what is next.",
      tension: "loyalty to what a thing used to be versus honesty about what it has become",
      advice: "Name what you are keeping alive out of attachment, and write down what specifically becomes possible the moment you release it.",
      warning: "the past bet you cannot bury keeps occupying the space, energy, and hope the next thing needs to grow",
      questions: ["What am I refusing to end because ending it would mean grieving it?"],
      register: "gravity",
      tags: { energy: "hold", focus: "work", function: "transform", expression: "blocked" },
    },
  },
  {
    slug: "the-iteration",
    name: "The Iteration",
    arcana: "MAJOR",
    jurisdictionKey: "incremental-refinement",
    jurisdiction: "the tight feedback loop that beats the grand rewrite",
    classical: { name: "Temperance", numeral: 14 },
    keywords: ["refinement", "balance", "learning"],
    contentVersion: CARD_CONTENT_VERSION,
    upright: {
      meaning:
        "Progress here is a series of small, honest loops, not one heroic leap. The Iteration blends what you have with what you are learning, adjusting by degrees so each change teaches you something before the next. The grand rewrite is a fantasy; the tenth small improvement is real.",
      tension: "the seduction of starting over clean versus the patience of improving what already exists",
      advice:
        "Ship the smallest improvement you can measure, learn from it, and let that lesson choose the next one before you touch anything larger.",
      warning: "you keep waiting for the perfect big overhaul while a hundred cheap improvements you could have made go unmade",
      questions: ["What is the next small, testable improvement?", "How could I tighten the loop between change and feedback?"],
      register: "quiet",
      tags: { energy: "hold", focus: "work", function: "transform", expression: "clear" },
    },
    reversed: {
      meaning:
        "Everything is changing at once, and that is exactly why nothing is learning. The Iteration reversed is the all-at-once overhaul that moves so many variables you cannot tell which change helped and which hurt. Motion this broad is not refinement; it is a reset that erases its own evidence.",
      tension: "the excitement of changing everything versus the discipline of isolating what actually matters",
      advice: "Freeze all but one variable, ship that single change, and refuse to touch the rest until you know what it did.",
      warning: "you rewrite the whole thing, feel productive, and end up unable to explain why it is better or worse than before",
      questions: ["What am I changing all at once because changing one thing feels too slow?"],
      register: "jolt",
      tags: { energy: "push", focus: "work", function: "transform", expression: "excessive" },
    },
  },
  {
    slug: "the-trap",
    name: "The Trap",
    arcana: "MAJOR",
    jurisdictionKey: "seductive-dependency",
    jurisdiction: "the seductive dependency that quietly takes the wheel",
    classical: { name: "The Devil", numeral: 15 },
    keywords: ["ego", "debt", "dependency"],
    contentVersion: CARD_CONTENT_VERSION,
    upright: {
      meaning:
        "Something has more power over this decision than it has earned — a flattering metric, a comfortable habit, a dependency you keep feeding. The Trap is not here to shame you; it is here to make the hook visible. What you can name, you can begin to loosen.",
      tension: "the comfort of the dependency versus the freedom you trade away to keep it",
      advice: "Name the one thing that has outsized power over this decision, and identify a single hook you could remove this week.",
      warning: "the dependency keeps steering from the shadows, and you keep mistaking its pull for your own free choice",
      questions: ["What has more power over this decision than it deserves?", "Which hook could I loosen first?"],
      register: "gravity",
      tags: { energy: "hold", focus: "self", function: "assess", expression: "clear" },
    },
    reversed: {
      // Redemptive reversal: the shadow lifts rather than deepens. Register is
      // warmth and expression is "released" because seeing the trap clearly is
      // itself the liberation — authentic to the Devil reversed, not forced.
      meaning:
        "The spell is breaking. Seen clearly, the trap loses its grip — you name the dependency out loud, remove one hook, and feel leverage return that you had forgotten was yours. Liberation here is not a dramatic escape; it is one honest act that proves the chain was never locked.",
      tension: "the small discomfort of loosening the hook versus the large freedom waiting on the other side of it",
      advice: "Take the one concrete action that reduces the dependency's grip today, however small, and notice the leverage it returns.",
      warning: "the clarity fades and the hook reattaches, and a trap you had already seen through quietly reclaims you",
      questions: ["What would I do next if this thing had no power over me?"],
      register: "warmth",
      tags: { energy: "release", focus: "self", function: "transform", expression: "released" },
    },
  },
  {
    slug: "the-north-star",
    name: "The North Star",
    arcana: "MAJOR",
    jurisdictionKey: "chosen-direction",
    jurisdiction: "the chosen direction that arbitrates tradeoffs",
    classical: { name: "The Star", numeral: 17 },
    keywords: ["hope", "mission", "direction"],
    contentVersion: CARD_CONTENT_VERSION,
    upright: {
      meaning:
        "When the choices multiply and the noise rises, the North Star is the direction you chose on purpose — the mission clear enough to settle an argument. It does not tell you every step, but it tells you which way is forward, and that is enough to make the hard tradeoff cleanly.",
      tension: "the pull of many reasonable local options versus the one direction you actually committed to",
      advice: "Write your mission in a single sentence, and use it to make one tradeoff you have been avoiding this week.",
      warning: "without a fixed direction every option looks equally valid, and you optimize busily in a circle",
      questions: ["What mission still feels worth the effort?", "Which tradeoff best serves the direction I chose?"],
      register: "warmth",
      tags: { energy: "hold", focus: "self", function: "assess", expression: "clear" },
    },
    reversed: {
      meaning:
        "The team is winning battles on a front that no longer leads anywhere. The North Star reversed is local optimization unmoored from purpose — every metric up, every sprint shipped, and the deeper direction quietly abandoned somewhere back down the road. Efficient motion is not the same as progress.",
      tension: "the satisfaction of local wins versus the direction they are quietly drifting away from",
      advice: "Stop and check every current priority against the mission; cut or reframe the ones that serve the metric but not the direction.",
      warning: "you arrive, efficient and exhausted, at a destination no one actually chose",
      questions: ["What am I optimizing so well that I have stopped asking whether it still points anywhere?"],
      register: "quiet",
      tags: { energy: "push", focus: "work", function: "assess", expression: "distorted" },
    },
  },
  {
    slug: "the-launch",
    name: "The Launch",
    arcana: "MAJOR",
    jurisdictionKey: "public-release",
    jurisdiction: "the moment the work makes contact with the world",
    classical: { name: "The Sun", numeral: 19 },
    keywords: ["visibility", "release", "traction"],
    contentVersion: CARD_CONTENT_VERSION,
    upright: {
      meaning:
        "The work is ready to meet the world, and the world is the only judge that counts. The Launch is daylight — the release that trades the safety of private polish for the real, irreplaceable information that only contact with actual users provides. Ship it and let reality talk back.",
      tension: "the safety of the unreleased draft versus the learning available only once real people touch it",
      advice: "Put the work in front of real users this week, even rough, and define the one signal you most need to hear back.",
      warning: "the work stays perfect and unproven in private while the market you were building for forgets it was waiting",
      questions: ["What could I release now, imperfect but real?", "What signal do I most need from actual users?"],
      register: "jolt",
      tags: { energy: "push", focus: "work", function: "create", expression: "clear" },
    },
    reversed: {
      meaning:
        "The polishing has become a bunker. Each new coat of finish feels like progress, but it is really a way of postponing the exposure a launch requires — the moment strangers get to have opinions. Perfection in private is the most comfortable place to hide from the market.",
      tension: "the pursuit of readiness versus the fear of being seen before you are perfect",
      advice: "Set a public release date within two weeks, tell someone, and ship whatever exists on that date rather than what you wish existed.",
      warning: "you refine indefinitely behind closed doors, and the feedback that would have made it great never gets the chance to arrive",
      questions: ["What am I polishing to avoid the moment strangers get to judge it?"],
      register: "quiet",
      tags: { energy: "hold", focus: "self", function: "create", expression: "avoided" },
    },
  },
  {
    slug: "the-reckoning",
    name: "The Reckoning",
    arcana: "MAJOR",
    jurisdictionKey: "judgment-and-consequence",
    jurisdiction: "the slow weight of judgment and consequence",
    classical: { name: "Judgement", numeral: 20 },
    keywords: ["accountability", "review", "awakening"],
    contentVersion: CARD_CONTENT_VERSION,
    upright: {
      meaning:
        "The results are in, and they are asking to be faced honestly. The Reckoning is the card of accountability — the clear-eyed review where you own what happened, what your choices caused, and what that now demands of you. This is not punishment; it is the moment experience becomes judgment.",
      tension: "the discomfort of facing consequences squarely versus the growth available only on the other side of that honesty",
      advice: "Write the honest account of what happened and your part in it, then name the one decision that must change because of it.",
      warning: "the unfaced consequence does not disappear; it recurs, larger, until you are forced to reckon with it on worse terms",
      questions: ["What is the honest account of what happened here?", "What must change now that I have seen it clearly?"],
      register: "gravity",
      tags: { energy: "hold", focus: "self", function: "transform", expression: "clear" },
    },
    reversed: {
      meaning:
        "The account is coming due and you are looking away. The Reckoning reversed is the deferred reckoning — the postmortem softened, the blame externalized, the lesson left unlearned so the pattern can quietly continue. Avoidance does not settle the debt; it only lets it compound.",
      tension: "protecting yourself from the discomfort of accountability at the price of repeating the mistake",
      advice: "Name the consequence you have been steering around, and hold the honest review you skipped before it repeats.",
      warning: "the same failure returns wearing a new face, and this time you cannot claim you did not know",
      questions: ["What accountability am I avoiding, and what is that avoidance protecting?"],
      register: "gravity",
      tags: { energy: "hold", focus: "self", function: "transform", expression: "avoided" },
    },
  },
  {
    slug: "the-legacy",
    name: "The Legacy",
    arcana: "MAJOR",
    jurisdictionKey: "enduring-impact",
    jurisdiction: "the work's arc beyond this single milestone",
    classical: { name: "The World", numeral: 21 },
    keywords: ["completion", "impact", "long game"],
    contentVersion: CARD_CONTENT_VERSION,
    upright: {
      meaning:
        "This milestone is a chapter in something longer than itself. The Legacy is the long view — the recognition that what you are building is meant to outlast this release and make things possible for people you may never meet. Completion here is not an ending but a contribution.",
      tension: "the pull of the next immediate milestone versus the longer arc the work is actually serving",
      advice: "Name what you want this work to make possible for someone else, and let that horizon shape one decision this week.",
      warning: "you optimize milestone to milestone and lose the thread of why any of it mattered in the first place",
      questions: ["What should this work make possible for others?", "What would I still respect about it five years from now?"],
      register: "warmth",
      tags: { energy: "release", focus: "relationships", function: "create", expression: "clear" },
    },
    reversed: {
      meaning:
        "Short-term pressure is pulling you off the long arc. The Legacy reversed is the urgent quarter crowding out the enduring thing — the choices that win this week while quietly mortgaging what the work was meant to become. Not everything that is urgent deserves the future you are trading for it.",
      tension: "the demands of the immediate versus the durability of what you actually care about building",
      advice: "Identify one short-term win that is costing you something lasting, and decide deliberately whether the trade is worth it.",
      warning: "you spend the foundation on the emergency, and the thing that could have endured is quietly hollowed out to survive the month",
      questions: ["What lasting thing am I trading away to win something urgent?"],
      register: "gravity",
      tags: { energy: "push", focus: "work", function: "create", expression: "distorted" },
    },
  },
] as const satisfies readonly CardContent[];

// ---------- Derivations ----------

export type CardSlug = (typeof CARD_CONTENTS)[number]["slug"];

export const CARD_CONTENT_BY_SLUG: Readonly<Record<CardSlug, CardContent>> = Object.fromEntries(
  CARD_CONTENTS.map((card) => [card.slug, card]),
) as Record<CardSlug, CardContent>;

/** name -> slug bridge while the database still keys cards on name. */
export const CARD_SLUG_BY_NAME: Readonly<Record<string, CardSlug>> = Object.fromEntries(
  CARD_CONTENTS.map((card) => [card.name, card.slug]),
) as Record<string, CardSlug>;

export function getCardContentByName(name: string): CardContent | null {
  const slug = CARD_SLUG_BY_NAME[name];
  return slug ? CARD_CONTENT_BY_SLUG[slug] : null;
}

export function orientationContent(card: CardContent, orientation: "UPRIGHT" | "REVERSED"): OrientationContent {
  return orientation === "REVERSED" ? card.reversed : card.upright;
}
