export const BUILDER_TYPES = [
  "Developer",
  "Designer",
  "Founder",
  "Artist",
  "Writer",
  "Student",
  "Freelancer",
  "Content Creator",
  "Other",
] as const;

export type BuilderType = (typeof BUILDER_TYPES)[number];

export const PROJECT_STAGES = [
  {
    key: "idea-spark",
    name: "Idea Spark",
    description: "I have an idea but don't know where to start.",
  },
  {
    key: "planning-the-build",
    name: "Planning the Build",
    description: "I need to turn the idea into a clear next step.",
  },
  {
    key: "mvp-mode",
    name: "MVP Mode",
    description: "I'm building the smallest useful version.",
  },
  {
    key: "stuck-blocked",
    name: "Stuck / Blocked",
    description: "I'm confused, overwhelmed, or avoiding the work.",
  },
  {
    key: "launch-prep",
    name: "Launch Prep",
    description: "I'm getting ready to share it with people.",
  },
  {
    key: "feedback-loop",
    name: "Feedback Loop",
    description: "People are reacting and I need to know what to do next.",
  },
  {
    key: "burnout-doubt",
    name: "Burnout / Doubt",
    description: "I'm tired and questioning the whole thing.",
  },
  {
    key: "growth-monetization",
    name: "Growth / Monetization",
    description: "I need to make it more valuable or profitable.",
  },
  {
    key: "pivot-point",
    name: "Pivot Point",
    description: "Something isn't working and I may need to change direction.",
  },
  {
    key: "completion-reflection",
    name: "Completion / Reflection",
    description: "I shipped something and need to learn from it.",
  },
] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];
export type ProjectStageKey = ProjectStage["key"];

export function getProjectStage(stageKey: ProjectStageKey) {
  return PROJECT_STAGES.find((stage) => stage.key === stageKey) ?? PROJECT_STAGES[0];
}
