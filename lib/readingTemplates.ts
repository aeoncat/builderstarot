import type { BuilderType, ProjectStageKey } from "@/lib/projectStages";

type ReadingTemplateInput = {
  stageKey: ProjectStageKey;
  stageName: string;
  positionLabel: string;
  positionPrompt: string;
  cardName: string;
  cardMeaning: string;
  builderType: BuilderType;
  context: string;
};

const stageAdvice: Record<ProjectStageKey, string> = {
  "idea-spark": "clarify the smallest version of the idea that still has energy",
  "planning-the-build": "turn the fuzzy shape into one concrete working constraint",
  "mvp-mode": "protect the useful core and resist polishing around it",
  "stuck-blocked": "name the real source of drag before trying another productivity trick",
  "launch-prep": "make the promise easy for someone else to understand and act on",
  "feedback-loop": "separate useful evidence from reactions that do not change the work",
  "burnout-doubt": "lower the load enough that you can return without forcing it",
  "growth-monetization": "connect value, audience, and repeatable traction more directly",
  "pivot-point": "use the evidence to change direction without treating the past work as wasted",
  "completion-reflection": "convert the finished work into better judgment for the next build",
};

const builderLenses: Record<BuilderType, string> = {
  Developer: "the system, scope, and feedback loop",
  Designer: "the experience, constraints, and visible promise",
  Founder: "the customer signal, positioning, and next decision",
  Artist: "the creative edge, energy, and audience connection",
  Writer: "the message, structure, and reader promise",
  Student: "the learning goal, deadline, and next practice rep",
  Freelancer: "the client value, boundaries, and delivery path",
  "Content Creator": "the audience signal, format, and publishing rhythm",
  Other: "the goal, constraints, and next useful move",
};

function contextLens(context: string) {
  const trimmed = context.trim();

  if (!trimmed) {
    return "Given the context you shared,";
  }

  const excerpt = trimmed.length > 120 ? `${trimmed.slice(0, 117).trim()}...` : trimmed;
  return `For "${excerpt}",`;
}

export function createProjectInterpretation(input: ReadingTemplateInput) {
  const stageMove = stageAdvice[input.stageKey];
  const builderLens = builderLenses[input.builderType];

  return `${contextLens(input.context)} ${input.cardName} in the ${input.positionLabel} position suggests looking at ${builderLens}. Its core message, "${input.cardMeaning}", points toward ${stageMove} instead of adding more noise around the project.`;
}

export function createProjectNextAction(input: ReadingTemplateInput) {
  const actionVerbs: Record<ProjectStageKey, string> = {
    "idea-spark": "Write a one-sentence promise and build one tiny proof of it.",
    "planning-the-build": "List three constraints, then choose the next task that fits inside them.",
    "mvp-mode": "Mark one feature as essential, one as later, and one as cut.",
    "stuck-blocked": "Set a 25-minute timer and work only on the blocker named by this card.",
    "launch-prep": "Draft the launch ask in plain language and send it to one real person.",
    "feedback-loop": "Group feedback into signal, noise, and next experiment before changing anything.",
    "burnout-doubt": "Remove or pause one energy drain for the next 48 hours.",
    "growth-monetization": "Test one value claim with one audience segment before expanding scope.",
    "pivot-point": "Write what failed, what you learned, and one smaller direction to test next.",
    "completion-reflection": "Capture one repeatable lesson and one thing you will do differently next time.",
  };

  return `${actionVerbs[input.stageKey]} Use the ${input.positionLabel.toLowerCase()} lens: ${input.positionPrompt}.`;
}
