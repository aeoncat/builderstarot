import { describe, expect, it } from "vitest";

import { PRODUCT_EVENT_NAMES, eventPropsSchema, parseProductEvent } from "@/lib/analytics/events";

const VALID_VISITOR = "3f2c1a9e-1111-4222-8333-abcdefabcdef";

describe("typed product events", () => {
  it("accepts every documented event name", () => {
    for (const name of PRODUCT_EVENT_NAMES) {
      expect(parseProductEvent({ name, visitorId: VALID_VISITOR, props: {} })).not.toBeNull();
    }
  });

  it("rejects unapproved event names", () => {
    expect(parseProductEvent({ name: "card_meaning_read", visitorId: VALID_VISITOR, props: {} })).toBeNull();
    expect(parseProductEvent({ name: "", visitorId: VALID_VISITOR, props: {} })).toBeNull();
  });

  it("rejects unapproved event properties", () => {
    expect(
      parseProductEvent({
        name: "reading_completed",
        visitorId: VALID_VISITOR,
        props: { surface: "daily", context: "I am building a secret startup" },
      }),
    ).toBeNull();
  });

  it("cannot carry raw context, journal text, or emails in any approved property", () => {
    // Free text is structurally impossible: every string prop is an enum or a
    // slug-constrained short string.
    expect(eventPropsSchema.safeParse({ source: "my whole life story here" }).success).toBe(false);
    expect(eventPropsSchema.safeParse({ source: "user@example.com" }).success).toBe(false);
    expect(eventPropsSchema.safeParse({ surface: "I am stuck on my habit tracker" }).success).toBe(false);
    expect(eventPropsSchema.safeParse({ plan: "call me maybe" }).success).toBe(false);
    // Approved slug-like values pass.
    expect(eventPropsSchema.safeParse({ source: "waitlist" }).success).toBe(true);
  });

  it("rejects extra top-level fields and malformed visitor ids", () => {
    expect(parseProductEvent({ name: "landing_viewed", visitorId: VALID_VISITOR, props: {}, email: "x@y.z" })).toBeNull();
    expect(parseProductEvent({ name: "landing_viewed", visitorId: "short", props: {} })).toBeNull();
    expect(parseProductEvent({ name: "landing_viewed", visitorId: "has spaces not allowed here", props: {} })).toBeNull();
  });

  it("accepts approved property combinations", () => {
    const parsed = parseProductEvent({
      name: "project_reading_completed",
      visitorId: VALID_VISITOR,
      props: { surface: "project-stage", stage: "mvp-mode", authed: true, reversedCount: 1 },
    });
    expect(parsed?.props.stage).toBe("mvp-mode");
  });
});
