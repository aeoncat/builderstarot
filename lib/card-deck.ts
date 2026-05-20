export type CreatorMajorCard = {
  name: string;
  arcana: "MAJOR";
  keywords: string[];
  uprightMeaning: string;
  reversedMeaning: string;
  promptQuestions: string[];
  imageUrl?: string | null;
};

export const CREATOR_MAJOR_ARCANA: CreatorMajorCard[] = [
  {
    name: "The Spark",
    arcana: "MAJOR",
    keywords: ["beginning", "risk", "permission"],
    uprightMeaning: "A new idea is asking for movement before certainty arrives.",
    reversedMeaning: "Waiting for perfect conditions is becoming a quiet no.",
    promptQuestions: ["What first step would make this real?", "What permission am I still waiting for?"],
  },
  {
    name: "The Builder",
    arcana: "MAJOR",
    keywords: ["craft", "agency", "execution"],
    uprightMeaning: "You have the tools, taste, and will to make the thing concrete.",
    reversedMeaning: "Capability is scattered because the work lacks a single point of focus.",
    promptQuestions: ["What can I build with what I already have?", "Where is my effort too divided?"],
  },
  {
    name: "The Signal",
    arcana: "MAJOR",
    keywords: ["insight", "intuition", "market"],
    uprightMeaning: "Subtle feedback is pointing toward the real opportunity.",
    reversedMeaning: "Noise, vanity metrics, or other people's urgency may be drowning out truth.",
    promptQuestions: ["What signal keeps repeating?", "What metric is distracting me from reality?"],
  },
  {
    name: "The Studio",
    arcana: "MAJOR",
    keywords: ["nurture", "environment", "creative supply"],
    uprightMeaning: "Your creative output improves when the environment supports deep making.",
    reversedMeaning: "The workspace, calendar, or team culture is draining the work before it matures.",
    promptQuestions: ["What conditions help my best work emerge?", "What part of the environment needs repair?"],
  },
  {
    name: "The Architect",
    arcana: "MAJOR",
    keywords: ["structure", "systems", "blueprint"],
    uprightMeaning: "A clear system will turn ambition into repeatable progress.",
    reversedMeaning: "Overdesign or vague ownership is slowing the build.",
    promptQuestions: ["What structure would remove friction?", "What am I overcomplicating?"],
  },
  {
    name: "The Mentor",
    arcana: "MAJOR",
    keywords: ["wisdom", "standards", "lineage"],
    uprightMeaning: "Experienced guidance can compress a hard lesson into a useful practice.",
    reversedMeaning: "Pride or isolation is making you relearn what someone could teach you.",
    promptQuestions: ["Who has already solved a version of this?", "What standard am I ready to inherit?"],
  },
  {
    name: "The Co-Founder",
    arcana: "MAJOR",
    keywords: ["alignment", "choice", "trust"],
    uprightMeaning: "The right partnership sharpens the mission and expands what is possible.",
    reversedMeaning: "Unspoken expectations are creating drag beneath the relationship.",
    promptQuestions: ["Where do we need cleaner alignment?", "What choice would protect trust?"],
  },
  {
    name: "The Sprint",
    arcana: "MAJOR",
    keywords: ["momentum", "deadline", "focus"],
    uprightMeaning: "A short, focused push can convert uncertainty into evidence.",
    reversedMeaning: "Motion is being confused with progress.",
    promptQuestions: ["What outcome defines this sprint?", "What should be cut until later?"],
  },
  {
    name: "The Operator",
    arcana: "MAJOR",
    keywords: ["discipline", "ops", "reliability"],
    uprightMeaning: "Operational discipline is turning the idea into something dependable.",
    reversedMeaning: "The system depends too much on heroic effort and too little on process.",
    promptQuestions: ["What needs a reliable operating rhythm?", "Where am I compensating with heroics?"],
  },
  {
    name: "The Deep Work",
    arcana: "MAJOR",
    keywords: ["solitude", "research", "focus"],
    uprightMeaning: "The answer needs uninterrupted attention, not another meeting.",
    reversedMeaning: "Avoiding solitude is keeping the real problem fuzzy.",
    promptQuestions: ["What deserves a protected block of focus?", "What am I avoiding by staying busy?"],
  },
  {
    name: "The Pivot",
    arcana: "MAJOR",
    keywords: ["timing", "cycle", "adaptation"],
    uprightMeaning: "The cycle is turning; adjust with the evidence instead of defending the old plan.",
    reversedMeaning: "Clinging to sunk costs is making the next move harder.",
    promptQuestions: ["What new information changes the plan?", "What cost am I afraid to write off?"],
  },
  {
    name: "The Standard",
    arcana: "MAJOR",
    keywords: ["quality", "ethics", "judgment"],
    uprightMeaning: "Hold the work to the bar that earns trust over time.",
    reversedMeaning: "A shortcut may solve today while weakening the foundation tomorrow.",
    promptQuestions: ["What quality bar matters here?", "What shortcut would I regret defending?"],
  },
  {
    name: "The Pause",
    arcana: "MAJOR",
    keywords: ["reframe", "patience", "constraint"],
    uprightMeaning: "A deliberate pause can reveal the move force cannot.",
    reversedMeaning: "Stalling has become a substitute for a hard decision.",
    promptQuestions: ["What changes if I look from another angle?", "Where has patience become avoidance?"],
  },
  {
    name: "The Sunset",
    arcana: "MAJOR",
    keywords: ["ending", "release", "transition"],
    uprightMeaning: "Ending the right thing frees energy for the next version of the work.",
    reversedMeaning: "Attachment to a past bet is blocking renewal.",
    promptQuestions: ["What needs to be sunset cleanly?", "What becomes possible after the ending?"],
  },
  {
    name: "The Iteration",
    arcana: "MAJOR",
    keywords: ["refinement", "balance", "learning"],
    uprightMeaning: "Small loops of feedback and adjustment will outperform a grand rewrite.",
    reversedMeaning: "Changing everything at once is hiding which change actually matters.",
    promptQuestions: ["What is the next useful iteration?", "How can I make the feedback loop tighter?"],
  },
  {
    name: "The Trap",
    arcana: "MAJOR",
    keywords: ["ego", "debt", "dependency"],
    uprightMeaning: "A seductive metric, habit, or dependency is asking for honest inspection.",
    reversedMeaning: "You can regain leverage by naming the trap and removing one hook.",
    promptQuestions: ["What has too much power over this decision?", "Which dependency can I loosen first?"],
  },
  {
    name: "The Outage",
    arcana: "MAJOR",
    keywords: ["crisis", "truth", "exposure"],
    uprightMeaning: "The breakage is showing exactly where the system was fragile.",
    reversedMeaning: "Avoiding the postmortem will preserve the same failure mode.",
    promptQuestions: ["What did the failure expose?", "What fix prevents this class of failure?"],
  },
  {
    name: "The North Star",
    arcana: "MAJOR",
    keywords: ["hope", "mission", "direction"],
    uprightMeaning: "Return to the mission clear enough to guide tradeoffs.",
    reversedMeaning: "The team may be optimizing locally while drifting from the deeper purpose.",
    promptQuestions: ["What mission still feels worth the effort?", "Which tradeoff best serves the north star?"],
  },
  {
    name: "The Fog",
    arcana: "MAJOR",
    keywords: ["uncertainty", "fear", "unknown"],
    uprightMeaning: "Not all risk is visible yet; move with experiments rather than assumptions.",
    reversedMeaning: "Fear is filling gaps that research or conversation could clarify.",
    promptQuestions: ["What assumption needs light?", "What tiny test would reduce uncertainty?"],
  },
  {
    name: "The Launch",
    arcana: "MAJOR",
    keywords: ["visibility", "release", "traction"],
    uprightMeaning: "The work is ready for contact with the real world.",
    reversedMeaning: "Private polishing is delaying the learning only launch can provide.",
    promptQuestions: ["What can be released now?", "What signal do I need from the market?"],
  },
  {
    name: "The Reckoning",
    arcana: "MAJOR",
    keywords: ["accountability", "review", "awakening"],
    uprightMeaning: "A clear review of consequences can turn experience into better judgment.",
    reversedMeaning: "Avoiding accountability is keeping the same pattern alive.",
    promptQuestions: ["What is the honest postmortem?", "What decision changes because of what I learned?"],
  },
  {
    name: "The Legacy",
    arcana: "MAJOR",
    keywords: ["completion", "impact", "long game"],
    uprightMeaning: "The work is becoming part of a larger arc than this milestone.",
    reversedMeaning: "Short-term pressure may be pulling you away from what should endure.",
    promptQuestions: ["What should this work make possible for others?", "What would I still respect five years from now?"],
  },
];

export const CURRENT_DECK_CARD_NAMES = CREATOR_MAJOR_ARCANA.map((card) => card.name);

const deckOrder = new Map(CURRENT_DECK_CARD_NAMES.map((name, index) => [name, index]));

export function sortByCreatorMajorOrder<T extends { name: string }>(cards: T[]) {
  return [...cards].sort((a, b) => (deckOrder.get(a.name) ?? Number.MAX_SAFE_INTEGER) - (deckOrder.get(b.name) ?? Number.MAX_SAFE_INTEGER));
}
