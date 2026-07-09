import { describe, expect, it } from "vitest";

import { createJournalSchema, surveySchema, waitlistSchema } from "@/lib/schemas";
import { serializeJournalEntry } from "@/lib/serializers";

describe("waitlist validation", () => {
  const valid = {
    email: "Builder@Example.com ",
    planPreference: "annual_39",
    interviewOptIn: true,
    updatesConsent: true,
    website: "",
  };

  it("accepts a valid entry and normalizes the email", () => {
    const parsed = waitlistSchema.parse(valid);
    expect(parsed.email).toBe("builder@example.com");
  });

  it("rejects invalid emails, unknown plans, and extra fields", () => {
    expect(waitlistSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
    expect(waitlistSchema.safeParse({ ...valid, planPreference: "free_forever" }).success).toBe(false);
    expect(waitlistSchema.safeParse({ ...valid, projectDetails: "my secret startup" }).success).toBe(false);
  });

  it("duplicate handling is upsert-by-email (schema allows resubmission)", () => {
    // The route upserts on the unique email column; both submissions parse
    // identically so a duplicate can only update its own preference.
    const first = waitlistSchema.parse(valid);
    const second = waitlistSchema.parse({ ...valid, planPreference: "monthly_5" });
    expect(first.email).toBe(second.email);
  });
});

describe("survey validation", () => {
  it("accepts only closed-choice answers", () => {
    expect(
      surveySchema.safeParse({
        changedPlans: "yes",
        topFeature: "saved_projects",
        pricePreference: "annual_39",
        interviewOptIn: false,
      }).success,
    ).toBe(true);
    expect(
      surveySchema.safeParse({
        changedPlans: "my long story",
        topFeature: "saved_projects",
        pricePreference: "annual_39",
      }).success,
    ).toBe(false);
    expect(
      surveySchema.safeParse({
        changedPlans: "yes",
        topFeature: "saved_projects",
        pricePreference: "annual_39",
        comment: "free text should not exist here",
      }).success,
    ).toBe(false);
  });
});

describe("journal snapshot schema", () => {
  it("accepts a project-reading snapshot without raw context", () => {
    const parsed = createJournalSchema.safeParse({
      spreadType: "project-stage:mvp-mode",
      cards: [
        {
          cardId: "c1",
          positionName: "Keep",
          orientation: "UPRIGHT",
          interpretationText: "The exact rendered interpretation.",
          nextActionText: "The exact rendered action.",
          reflectionQuestionText: "The question?",
          positionRole: "keep",
          cardContentVersion: 1,
        },
      ],
      projectStage: "mvp-mode",
      subject: "your habit tracker",
      synthesisHeadline: "Problem Named, Remedy Ready",
      synthesisSummary: "A summary.",
      engineVersion: 2,
      synthesisVersion: 1,
    });
    expect(parsed.success).toBe(true);
  });

  it("still accepts legacy card-only saves (no snapshot fields)", () => {
    const parsed = createJournalSchema.safeParse({
      spreadType: "daily",
      cards: [{ cardId: "c1", positionName: "Daily Insight", orientation: "REVERSED" }],
    });
    expect(parsed.success).toBe(true);
  });

  it("caps snapshot text lengths", () => {
    const parsed = createJournalSchema.safeParse({
      spreadType: "project-stage:mvp-mode",
      cards: [
        {
          cardId: "c1",
          positionName: "Keep",
          orientation: "UPRIGHT",
          interpretationText: "x".repeat(2001),
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });
});

describe("journal snapshot serialization + fallback", () => {
  const baseCard = {
    id: "card-1",
    name: "The Sprint",
    arcana: "MAJOR",
    suit: null,
    rank: null,
    keywords: "[]",
    uprightMeaning: "up",
    reversedMeaning: "rev",
    promptQuestions: "[]",
    imageUrl: null,
    createdAt: new Date(),
  };

  function entryWith(cardOverrides: object, entryOverrides: object = {}) {
    return {
      id: "e1",
      userId: "u1",
      spreadType: "project-stage:mvp-mode",
      userNotes: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      spreadSessionId: null,
      projectStage: null,
      subject: null,
      synthesisHeadline: null,
      synthesisSummary: null,
      synthesisPriorityAction: null,
      engineVersion: null,
      synthesisVersion: null,
      ...entryOverrides,
      cards: [
        {
          id: "jc1",
          journalEntryId: "e1",
          cardId: "card-1",
          positionName: "Keep",
          orientation: "UPRIGHT",
          sortOrder: 0,
          interpretationText: null,
          nextActionText: null,
          reflectionQuestionText: null,
          positionRole: null,
          cardContentVersion: null,
          ...cardOverrides,
          card: baseCard,
        },
      ],
    };
  }

  it("serializes snapshot text when present", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serialized = serializeJournalEntry(entryWith({ interpretationText: "Exact text." }, { synthesisHeadline: "H" }) as any);
    expect(serialized.cards[0].interpretationText).toBe("Exact text.");
    expect(serialized.synthesisHeadline).toBe("H");
  });

  it("returns nulls for pre-snapshot entries so the UI falls back to the engine", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serialized = serializeJournalEntry(entryWith({}) as any);
    expect(serialized.cards[0].interpretationText).toBeNull();
    expect(serialized.synthesisHeadline).toBeNull();
    // Fallback renderer inputs remain available.
    expect(serialized.cards[0].card.uprightMeaning).toBe("up");
  });
});
