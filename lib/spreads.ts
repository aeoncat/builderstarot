import type { PositionRole } from "@/lib/position-roles";
import type { ProjectStageKey } from "@/lib/projectStages";

export type ProjectSpreadPosition = {
  /** Display label only — decoupled from semantics. Stored on new draws;
   *  historical draws keep whatever label they were stored with. */
  label: string;
  prompt: string;
  /** Semantic role driving the interpretation engine. */
  role: PositionRole;
};

export type ProjectStageSpread = {
  name: string;
  positions: [ProjectSpreadPosition, ProjectSpreadPosition, ProjectSpreadPosition];
};

// Position labels that collided with card names ("The Signal", "The Trap",
// "The Iteration") were renamed in display config only; stored history is
// never rewritten.
export const PROJECT_STAGE_SPREADS: Record<ProjectStageKey, ProjectStageSpread> = {
  "idea-spark": {
    name: "Idea Spark Spread",
    positions: [
      { label: "The Pull", prompt: "what part of the idea has energy?", role: "resource" },
      { label: "The Tangle", prompt: "what could make you overcomplicate it?", role: "blocker" },
      { label: "The First Brick", prompt: "the smallest useful next step", role: "advice" },
    ],
  },
  "planning-the-build": {
    name: "Planning the Build Spread",
    positions: [
      { label: "The Shape", prompt: "what this wants to become", role: "trajectory" },
      { label: "The Constraint", prompt: "what you need to work within", role: "blocker" },
      { label: "The Plan", prompt: "what to do next", role: "advice" },
    ],
  },
  "mvp-mode": {
    name: "MVP Mode Spread",
    positions: [
      { label: "Keep", prompt: "what matters most", role: "keep" },
      { label: "Cut", prompt: "what can wait", role: "cut" },
      { label: "Ship", prompt: "what to finish next", role: "advice" },
    ],
  },
  "stuck-blocked": {
    name: "Stuck / Blocked Spread",
    positions: [
      { label: "The Real Blocker", prompt: "what is actually slowing you down", role: "blocker" },
      { label: "The Avoided Truth", prompt: "what you may not want to admit", role: "problem" },
      { label: "The Unlock", prompt: "the next move that breaks the loop", role: "lever" },
    ],
  },
  "launch-prep": {
    name: "Launch Prep Spread",
    positions: [
      { label: "The Promise", prompt: "what value you are offering", role: "resource" },
      { label: "The Audience", prompt: "who needs this most", role: "insight" },
      { label: "The Ask", prompt: "what action users should take", role: "advice" },
    ],
  },
  "feedback-loop": {
    name: "Feedback Loop Spread",
    positions: [
      { label: "The Evidence", prompt: "what feedback matters", role: "resource" },
      { label: "The Noise", prompt: "what feedback to ignore", role: "cut" },
      { label: "The Next Move", prompt: "what to improve next", role: "advice" },
    ],
  },
  "burnout-doubt": {
    name: "Burnout / Doubt Spread",
    positions: [
      { label: "The Drain", prompt: "what is costing too much energy", role: "problem" },
      { label: "The Boundary", prompt: "what needs to be simplified or paused", role: "cut" },
      { label: "The Return Path", prompt: "how to re-enter gently", role: "advice" },
    ],
  },
  "growth-monetization": {
    name: "Growth / Monetization Spread",
    positions: [
      { label: "The Value", prompt: "what people may pay for", role: "resource" },
      { label: "The Bottleneck", prompt: "what limits growth", role: "blocker" },
      { label: "The Lever", prompt: "what could increase traction", role: "lever" },
    ],
  },
  "pivot-point": {
    name: "Pivot Point Spread",
    positions: [
      { label: "The Friction", prompt: "what is not working", role: "problem" },
      { label: "The Lesson", prompt: "what this taught you", role: "lesson" },
      { label: "The New Direction", prompt: "what to try next", role: "trajectory" },
    ],
  },
  "completion-reflection": {
    name: "Completion / Reflection Spread",
    positions: [
      { label: "The Win", prompt: "what worked", role: "resource" },
      { label: "The Scar", prompt: "what was hard but useful", role: "lesson" },
      { label: "The Wisdom", prompt: "what to carry forward", role: "lesson" },
    ],
  },
};

export function getProjectStageSpread(stageKey: ProjectStageKey) {
  return PROJECT_STAGE_SPREADS[stageKey];
}
