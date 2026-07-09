"use client";

/**
 * Client-side event tracking. Fire-and-forget POSTs to /api/events; failures
 * are silent (analytics must never break the product). Typed against the
 * event vocabulary so unapproved names/props cannot compile.
 */

import type { ProductEventName, ProductEventProps } from "@/lib/analytics/events";
import {
  detectReturnVisit,
  getOrCreateVisitorId,
  incrementReadingCount,
  markOnce,
} from "@/lib/analytics/visitor";
import { getLocalDateKey } from "@/lib/time";

function localStore() {
  return typeof window === "undefined" ? null : window.localStorage;
}

function sessionStore() {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

export function visitorId(): string | null {
  const store = localStore();
  if (!store) return null;
  return getOrCreateVisitorId(store, () => crypto.randomUUID());
}

export function track(name: ProductEventName, props: ProductEventProps = {}): void {
  const vid = visitorId();
  if (!vid) return;
  try {
    void fetch("/api/events", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, visitorId: vid, props }),
    }).catch(() => undefined);
  } catch {
    // Analytics must never surface errors to the user.
  }
}

/** Track at most once per browser session for a given action key. */
export function trackOnce(onceKey: string, name: ProductEventName, props: ProductEventProps = {}): void {
  const store = sessionStore();
  if (!store) return;
  if (!markOnce(store, onceKey)) return;
  track(name, props);
}

/** Track a completed reading exactly once per result, and bump the local
 *  completed-readings counter used by prompt/survey eligibility. */
export function trackReadingCompleted(
  onceKey: string,
  name: "reading_completed" | "project_reading_completed",
  props: ProductEventProps = {},
): void {
  const session = sessionStore();
  const local = localStore();
  if (!session || !local) return;
  if (!markOnce(session, onceKey)) return;
  incrementReadingCount(local);
  track(name, props);
}

/** Call on app boot: emits return_visit when last seen on an earlier day. */
export function trackVisit(): void {
  const store = localStore();
  if (!store) return;
  if (detectReturnVisit(store, getLocalDateKey())) {
    trackOnce(`return:${getLocalDateKey()}`, "return_visit");
  }
}
