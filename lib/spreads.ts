import type { ProjectStageKey } from "@/lib/projectStages";

export type ProjectSpreadPosition = {
  label: string;
  prompt: string;
};

export type ProjectStageSpread = {
  name: string;
  positions: [ProjectSpreadPosition, ProjectSpreadPosition, ProjectSpreadPosition];
};

export const PROJECT_STAGE_SPREADS: Record<ProjectStageKey, ProjectStageSpread> = {
  "idea-spark": {
    name: "Idea Spark Spread",
    positions: [
      { label: "The Signal", prompt: "what part of the idea has energy?" },
      { label: "The Trap", prompt: "what could make you overcomplicate it?" },
      { label: "The First Brick", prompt: "the smallest useful next step" },
    ],
  },
  "planning-the-build": {
    name: "Planning the Build Spread",
    positions: [
      { label: "The Shape", prompt: "what this wants to become" },
      { label: "The Constraint", prompt: "what you need to work within" },
      { label: "The Plan", prompt: "what to do next" },
    ],
  },
  "mvp-mode": {
    name: "MVP Mode Spread",
    positions: [
      { label: "Keep", prompt: "what matters most" },
      { label: "Cut", prompt: "what can wait" },
      { label: "Ship", prompt: "what to finish next" },
    ],
  },
  "stuck-blocked": {
    name: "Stuck / Blocked Spread",
    positions: [
      { label: "The Real Blocker", prompt: "what is actually slowing you down" },
      { label: "The Avoided Truth", prompt: "what you may not want to admit" },
      { label: "The Unlock", prompt: "the next move that breaks the loop" },
    ],
  },
  "launch-prep": {
    name: "Launch Prep Spread",
    positions: [
      { label: "The Promise", prompt: "what value you are offering" },
      { label: "The Audience", prompt: "who needs this most" },
      { label: "The Ask", prompt: "what action users should take" },
    ],
  },
  "feedback-loop": {
    name: "Feedback Loop Spread",
    positions: [
      { label: "The Signal", prompt: "what feedback matters" },
      { label: "The Noise", prompt: "what feedback to ignore" },
      { label: "The Iteration", prompt: "what to improve next" },
    ],
  },
  "burnout-doubt": {
    name: "Burnout / Doubt Spread",
    positions: [
      { label: "The Drain", prompt: "what is costing too much energy" },
      { label: "The Boundary", prompt: "what needs to be simplified or paused" },
      { label: "The Return Path", prompt: "how to re-enter gently" },
    ],
  },
  "growth-monetization": {
    name: "Growth / Monetization Spread",
    positions: [
      { label: "The Value", prompt: "what people may pay for" },
      { label: "The Bottleneck", prompt: "what limits growth" },
      { label: "The Lever", prompt: "what could increase traction" },
    ],
  },
  "pivot-point": {
    name: "Pivot Point Spread",
    positions: [
      { label: "The Friction", prompt: "what is not working" },
      { label: "The Lesson", prompt: "what this taught you" },
      { label: "The New Direction", prompt: "what to try next" },
    ],
  },
  "completion-reflection": {
    name: "Completion / Reflection Spread",
    positions: [
      { label: "The Win", prompt: "what worked" },
      { label: "The Scar", prompt: "what was hard but useful" },
      { label: "The Wisdom", prompt: "what to carry forward" },
    ],
  },
};

export function getProjectStageSpread(stageKey: ProjectStageKey) {
  return PROJECT_STAGE_SPREADS[stageKey];
}
