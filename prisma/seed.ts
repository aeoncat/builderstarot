import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

type SeedCard = {
  name: string;
  arcana: "MAJOR" | "MINOR";
  suit?: "IDEAS" | "EMOTIONS" | "CODE" | "GROWTH";
  rank?:
    | "ACE"
    | "TWO"
    | "THREE"
    | "FOUR"
    | "FIVE"
    | "NOVICE"
    | "APPRENTICE"
    | "EXPERT"
    | "LEAD";
  keywords: string[];
  uprightMeaning: string;
  reversedMeaning: string;
  promptQuestions: string[];
  imageUrl?: string;
};

const majorArcana: SeedCard[] = [
  {
    name: "The Dropout",
    arcana: "MAJOR",
    keywords: ["leap", "fresh start", "courage"],
    uprightMeaning: "Take the first imperfect step and trust your builder instincts.",
    reversedMeaning: "Fear of looking foolish is blocking a promising start.",
    promptQuestions: ["Where can I ship before I feel ready?", "What risk is worth taking today?"],
  },
  {
    name: "The Architect",
    arcana: "MAJOR",
    keywords: ["vision", "systems", "structure"],
    uprightMeaning: "Your blueprint is strong; now convert vision into repeatable systems.",
    reversedMeaning: "Over-planning is replacing real iteration and feedback.",
    promptQuestions: ["What is the simplest version of this system?", "What am I over-designing?"],
  },
  {
    name: "The Mentor",
    arcana: "MAJOR",
    keywords: ["guidance", "wisdom", "craft"],
    uprightMeaning: "Seek trusted feedback and borrow wisdom from experienced builders.",
    reversedMeaning: "You may be ignoring advice that would save you time.",
    promptQuestions: ["Who can review this honestly?", "What lesson keeps repeating?"],
  },
  {
    name: "The Sprint",
    arcana: "MAJOR",
    keywords: ["momentum", "focus", "deadline"],
    uprightMeaning: "Commit to a tight sprint and finish one clear outcome.",
    reversedMeaning: "Busy work is stealing focus from meaningful delivery.",
    promptQuestions: ["What is the single sprint objective?", "What must be cut this week?"],
  },
  {
    name: "The Merge",
    arcana: "MAJOR",
    keywords: ["integration", "alignment", "partnership"],
    uprightMeaning: "A strategic collaboration can unlock your next level.",
    reversedMeaning: "Misalignment in expectations is causing hidden friction.",
    promptQuestions: ["Where do goals need clearer alignment?", "What would healthy collaboration look like?"],
  },
  {
    name: "The Burnout",
    arcana: "MAJOR",
    keywords: ["limits", "rest", "sustainability"],
    uprightMeaning: "Pace yourself so your work remains meaningful over time.",
    reversedMeaning: "Ignoring recovery will shrink your creative range.",
    promptQuestions: ["What boundary needs reinforcement?", "How can I make this pace sustainable?"],
  },
  {
    name: "The Launch",
    arcana: "MAJOR",
    keywords: ["release", "visibility", "impact"],
    uprightMeaning: "You are ready to share your work and gather real-world signal.",
    reversedMeaning: "Perfectionism is delaying the learning only launch can provide.",
    promptQuestions: ["What can I launch this cycle?", "What feedback do I need most?"],
  },
  {
    name: "The Refactor",
    arcana: "MAJOR",
    keywords: ["cleanup", "clarity", "resilience"],
    uprightMeaning: "Simplifying now will compound speed and reliability later.",
    reversedMeaning: "Technical debt is starting to set your roadmap.",
    promptQuestions: ["What complexity can I remove?", "What legacy choice needs rethinking?"],
  },
  {
    name: "The Community",
    arcana: "MAJOR",
    keywords: ["network", "support", "belonging"],
    uprightMeaning: "Your momentum grows when you build in public and connect.",
    reversedMeaning: "Isolation is reducing your perspective and opportunities.",
    promptQuestions: ["Where can I ask for help?", "How can I contribute to others?"],
  },
  {
    name: "The Legacy",
    arcana: "MAJOR",
    keywords: ["purpose", "impact", "long game"],
    uprightMeaning: "Design with long-term impact in mind, not just short-term wins.",
    reversedMeaning: "Short-term pressure may be pulling you off your true mission.",
    promptQuestions: ["What outcome matters in five years?", "What can I build that outlasts trends?"],
  },
];

const minorCards: SeedCard[] = [
  { name: "Ace of Ideas", arcana: "MINOR", suit: "IDEAS", rank: "ACE", keywords: ["spark", "new concept", "clarity"], uprightMeaning: "A fresh concept appears with real potential.", reversedMeaning: "A promising idea needs sharper definition.", promptQuestions: ["What idea keeps returning?", "How do I test it quickly?"] },
  { name: "Two of Ideas", arcana: "MINOR", suit: "IDEAS", rank: "TWO", keywords: ["choice", "comparison", "direction"], uprightMeaning: "You are choosing between two viable directions.", reversedMeaning: "Analysis paralysis is slowing your momentum.", promptQuestions: ["What criteria matter most?", "What can I decide today?"] },
  { name: "Three of Ideas", arcana: "MINOR", suit: "IDEAS", rank: "THREE", keywords: ["collaboration", "brainstorm", "feedback"], uprightMeaning: "Shared ideation makes your concept stronger.", reversedMeaning: "Too many voices may be diluting the core.", promptQuestions: ["Who should I brainstorm with?", "What is the core thesis?"] },
  { name: "Four of Ideas", arcana: "MINOR", suit: "IDEAS", rank: "FOUR", keywords: ["incubation", "pause", "insight"], uprightMeaning: "Step back to let a better solution emerge.", reversedMeaning: "Overthinking is replacing small experiments.", promptQuestions: ["What if I simplify this problem?", "Where do I need mental space?"] },
  { name: "Five of Ideas", arcana: "MINOR", suit: "IDEAS", rank: "FIVE", keywords: ["friction", "debate", "creative tension"], uprightMeaning: "Conflict can refine the best idea if handled well.", reversedMeaning: "Ego-driven debate is draining creative energy.", promptQuestions: ["What disagreement is actually useful?", "How can I reduce heat and keep rigor?"] },

  { name: "Ace of Emotions", arcana: "MINOR", suit: "EMOTIONS", rank: "ACE", keywords: ["openness", "trust", "empathy"], uprightMeaning: "Lead with emotional honesty in your work.", reversedMeaning: "Unspoken feelings may be shaping decisions.", promptQuestions: ["What emotion needs acknowledgment?", "Where can I be more transparent?"] },
  { name: "Two of Emotions", arcana: "MINOR", suit: "EMOTIONS", rank: "TWO", keywords: ["partnership", "alignment", "connection"], uprightMeaning: "A key relationship is entering deeper alignment.", reversedMeaning: "A mismatch in values needs honest discussion.", promptQuestions: ["What does healthy partnership require?", "What needs to be said clearly?"] },
  { name: "Three of Emotions", arcana: "MINOR", suit: "EMOTIONS", rank: "THREE", keywords: ["celebration", "team morale", "support"], uprightMeaning: "Celebrate progress and reinforce your support system.", reversedMeaning: "Neglecting wins can quietly erode morale.", promptQuestions: ["What win should we celebrate?", "Who deserves recognition?"] },
  { name: "Four of Emotions", arcana: "MINOR", suit: "EMOTIONS", rank: "FOUR", keywords: ["apathy", "recalibration", "inner check"], uprightMeaning: "Reconnect with your deeper reason for building.", reversedMeaning: "Numbness is a sign to reset your habits.", promptQuestions: ["What has lost meaning lately?", "What would re-energize me?"] },
  { name: "Five of Emotions", arcana: "MINOR", suit: "EMOTIONS", rank: "FIVE", keywords: ["grief", "repair", "acceptance"], uprightMeaning: "Disappointment is real, but not the end of your path.", reversedMeaning: "Holding on to setbacks is blocking renewed trust.", promptQuestions: ["What am I ready to release?", "What remains possible from here?"] },

  { name: "Ace of Code", arcana: "MINOR", suit: "CODE", rank: "ACE", keywords: ["prototype", "logic", "clean start"], uprightMeaning: "You have a clean technical opening to build fast.", reversedMeaning: "Your approach needs one more pass of clarity.", promptQuestions: ["What is the smallest useful prototype?", "What assumptions can I test first?"] },
  { name: "Two of Code", arcana: "MINOR", suit: "CODE", rank: "TWO", keywords: ["balance", "tradeoffs", "priorities"], uprightMeaning: "Manage competing priorities with disciplined tradeoffs.", reversedMeaning: "Context switching is weakening implementation quality.", promptQuestions: ["What can move to later?", "Which tradeoff best serves users?"] },
  { name: "Three of Code", arcana: "MINOR", suit: "CODE", rank: "THREE", keywords: ["review", "quality", "craft"], uprightMeaning: "Code quality improves through review and iteration.", reversedMeaning: "Skipping review is adding avoidable risk.", promptQuestions: ["Where do I need peer review?", "What quality bar matters here?"] },
  { name: "Four of Code", arcana: "MINOR", suit: "CODE", rank: "FOUR", keywords: ["stability", "tests", "hardening"], uprightMeaning: "Strengthen the foundation before adding new features.", reversedMeaning: "Fragile foundations will slow every future change.", promptQuestions: ["What part needs hardening?", "Which test would prevent regressions?"] },
  { name: "Five of Code", arcana: "MINOR", suit: "CODE", rank: "FIVE", keywords: ["bugs", "friction", "resilience"], uprightMeaning: "A bug cycle is teaching where resilience is weak.", reversedMeaning: "Frustration can be reduced by better observability.", promptQuestions: ["What is the root cause pattern?", "What signal am I missing?"] },

  { name: "Ace of Growth", arcana: "MINOR", suit: "GROWTH", rank: "ACE", keywords: ["opportunity", "value", "seed"], uprightMeaning: "A practical growth opportunity is ready to be planted.", reversedMeaning: "Potential growth lacks a concrete plan.", promptQuestions: ["What seed can I plant this week?", "How will I measure traction?"] },
  { name: "Two of Growth", arcana: "MINOR", suit: "GROWTH", rank: "TWO", keywords: ["resource planning", "budget", "focus"], uprightMeaning: "Careful resource choices will sustain momentum.", reversedMeaning: "Spreading resources thin risks shallow outcomes.", promptQuestions: ["Where should resources be concentrated?", "What spend has unclear return?"] },
  { name: "Three of Growth", arcana: "MINOR", suit: "GROWTH", rank: "THREE", keywords: ["craft mastery", "delivery", "value"], uprightMeaning: "Steady craftsmanship is producing meaningful value.", reversedMeaning: "Inconsistent execution is limiting visible progress.", promptQuestions: ["What process needs consistency?", "What value did I deliver lately?"] },
  { name: "Four of Growth", arcana: "MINOR", suit: "GROWTH", rank: "FOUR", keywords: ["stability", "conservation", "control"], uprightMeaning: "Protect what works while preparing the next move.", reversedMeaning: "Overprotecting resources may block healthy growth.", promptQuestions: ["What should I protect right now?", "Where am I overly cautious?"] },
  { name: "Five of Growth", arcana: "MINOR", suit: "GROWTH", rank: "FIVE", keywords: ["setback", "scarcity", "recovery"], uprightMeaning: "A temporary setback can reveal smarter strategy.", reversedMeaning: "Scarcity thinking is obscuring available options.", promptQuestions: ["What asset am I overlooking?", "How can I recover strategically?"] },
];

const courtCards: SeedCard[] = [
  { name: "Novice of Ideas", arcana: "MINOR", suit: "IDEAS", rank: "NOVICE", keywords: ["curiosity", "beginner mind", "exploration"], uprightMeaning: "Approach your next concept with bold curiosity.", reversedMeaning: "Self-doubt is muting your natural creativity.", promptQuestions: ["What am I excited to learn?", "What if I allowed myself to be a beginner?"] },
  { name: "Apprentice of Emotions", arcana: "MINOR", suit: "EMOTIONS", rank: "APPRENTICE", keywords: ["action", "heart-led", "devotion"], uprightMeaning: "Take heart-led action and let care guide momentum.", reversedMeaning: "Emotional impulsiveness may cloud your judgment.", promptQuestions: ["How can I act with both courage and care?", "What emotional signal needs grounding?"] },
  { name: "Expert of Code", arcana: "MINOR", suit: "CODE", rank: "EXPERT", keywords: ["mastery", "clarity", "precision"], uprightMeaning: "Your technical mastery can simplify complexity for others.", reversedMeaning: "Over-control may be reducing team ownership.", promptQuestions: ["Where can I teach through clearer systems?", "What can I delegate with confidence?"] },
  { name: "Lead of Growth", arcana: "MINOR", suit: "GROWTH", rank: "LEAD", keywords: ["stewardship", "strategy", "long-term"], uprightMeaning: "Lead with steady strategy and principled resource choices.", reversedMeaning: "Rigid control may be limiting adaptive growth.", promptQuestions: ["What growth principle should lead this decision?", "How can I empower others to grow?"] },
];

const cards = [...majorArcana, ...minorCards, ...courtCards];

async function main() {
  await prisma.spreadCard.deleteMany();
  await prisma.journalEntryCard.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.dailyDraw.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.spreadSession.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.card.deleteMany();
  await prisma.user.deleteMany();

  await prisma.card.createMany({
    data: cards.map((card) => ({
      ...card,
      keywords: JSON.stringify(card.keywords),
      promptQuestions: JSON.stringify(card.promptQuestions),
    })),
  });

  const passwordHash = await hash("builder123", 10);

  await prisma.user.create({
    data: {
      name: "Demo Builder",
      email: "demo@builderstarot.local",
      passwordHash,
    },
  });

  console.log(`Seeded ${cards.length} cards and demo user.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
