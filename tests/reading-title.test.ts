import { describe, expect, it } from "vitest";

import { PROJECT_STAGES } from "@/lib/projectStages";
import { formatReadingTitle, stageLabel } from "@/lib/readingTitle";

describe("formatReadingTitle — project readings", () => {
  it("produces a readable title for all ten stages, name-led", () => {
    for (const stage of PROJECT_STAGES) {
      const result = formatReadingTitle({
        spreadType: `project-stage:${stage.key}`,
        projectStage: stage.key,
        projectName: "Builders Tarot",
      });
      expect(result.title).toBe("Builders Tarot");
      expect(result.label).toBe(`${stage.name} Reading`);
      // No internal identifier or slug may surface.
      expect(`${result.title} ${result.label}`).not.toContain(":");
      expect(`${result.title} ${result.label}`).not.toContain(stage.key);
    }
  });

  it("falls back to the stage reading when no project name is stored", () => {
    for (const stage of PROJECT_STAGES) {
      const result = formatReadingTitle({
        spreadType: `project-stage:${stage.key}`,
        projectStage: stage.key,
        projectName: "",
      });
      expect(result.title).toBe(`${stage.name} Reading`);
      expect(result.label).toBeUndefined();
      expect(result.title).not.toContain(":");
    }
  });

  it("matches the required example exactly", () => {
    expect(
      formatReadingTitle({ spreadType: "project-stage:launch-prep", projectStage: "launch-prep", projectName: "Builders Tarot" }),
    ).toEqual({ title: "Builders Tarot", label: "Launch Prep Reading" });

    expect(
      formatReadingTitle({ spreadType: "project-stage:launch-prep", projectStage: "launch-prep", projectName: "" }),
    ).toEqual({ title: "Launch Prep Reading" });
  });

  it("stays readable for legacy project entries with no stored stage key", () => {
    const result = formatReadingTitle({ spreadType: "project-stage:mvp-mode" });
    expect(result.title).toBe("MVP Mode Reading");
    expect(result.title).not.toContain(":");
    expect(result.title).not.toContain("mvp-mode");
  });

  it("treats a whitespace-only project name as empty", () => {
    const result = formatReadingTitle({ spreadType: "project-stage:idea-spark", projectStage: "idea-spark", projectName: "   " });
    expect(result.title).toBe("Idea Spark Reading");
    expect(result.label).toBeUndefined();
  });
});

describe("formatReadingTitle — other spreads", () => {
  it("gives friendly names to the built-in spread slugs", () => {
    expect(formatReadingTitle({ spreadType: "single" }).title).toBe("Single-Card Reading");
    expect(formatReadingTitle({ spreadType: "three" }).title).toBe("Three-Card Reading");
    expect(formatReadingTitle({ spreadType: "five" }).title).toBe("Five-Card Reading");
    expect(formatReadingTitle({ spreadType: "daily" }).title).toBe("Daily Card Reading");
  });

  it("prettifies unknown slugs without leaking them", () => {
    const result = formatReadingTitle({ spreadType: "past-present-future" });
    expect(result.title).toBe("Past Present Future Reading");
    expect(result.title).not.toContain("-");
  });
});

describe("stageLabel", () => {
  it("maps every stage key to its display name", () => {
    for (const stage of PROJECT_STAGES) {
      expect(stageLabel(stage.key)).toBe(stage.name);
    }
  });

  it("title-cases unknown keys as a safe fallback", () => {
    expect(stageLabel("some-new-stage")).toBe("Some New Stage");
  });
});
