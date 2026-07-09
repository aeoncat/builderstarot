/**
 * Pseudonymous visitor identity + once-per-action dedupe.
 *
 * Pure logic over an injected key-value store so it can be unit-tested; the
 * client wires it to localStorage/sessionStorage. No fingerprinting, no IP,
 * no location, no advertising identifiers — a single random UUID stored
 * locally, plus date bookkeeping for return-visit detection.
 */

export type KeyValueStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export const VISITOR_ID_KEY = "bt_vid";
export const LAST_SEEN_KEY = "bt_last_seen";
export const READING_COUNT_KEY = "bt_completed_readings";

const VISITOR_ID_PATTERN = /^[a-zA-Z0-9-]{8,64}$/;

export function getOrCreateVisitorId(store: KeyValueStore, randomId: () => string): string {
  const existing = store.getItem(VISITOR_ID_KEY);
  if (existing && VISITOR_ID_PATTERN.test(existing)) return existing;
  const created = randomId();
  store.setItem(VISITOR_ID_KEY, created);
  return created;
}

/**
 * Returns true (and records today) when the visitor was last seen on an
 * earlier calendar day — i.e. this visit counts as a return visit. First-ever
 * visits record the date but do not count as returns.
 */
export function detectReturnVisit(store: KeyValueStore, todayKey: string): boolean {
  const lastSeen = store.getItem(LAST_SEEN_KEY);
  store.setItem(LAST_SEEN_KEY, todayKey);
  return lastSeen !== null && lastSeen < todayKey;
}

/**
 * Once-per-key action dedupe (React StrictMode double-effects, rerenders,
 * accidental double-clicks). Returns true exactly once per key per store
 * lifetime (session-scoped when wired to sessionStorage).
 */
export function markOnce(store: KeyValueStore, key: string): boolean {
  const storageKey = `bt_once:${key}`;
  if (store.getItem(storageKey) !== null) return false;
  store.setItem(storageKey, "1");
  return true;
}

/** Local completed-readings counter used by prompt/survey eligibility gates. */
export function incrementReadingCount(store: KeyValueStore): number {
  const current = Number.parseInt(store.getItem(READING_COUNT_KEY) ?? "0", 10);
  const next = (Number.isFinite(current) && current >= 0 ? current : 0) + 1;
  store.setItem(READING_COUNT_KEY, String(next));
  return next;
}

export function getReadingCount(store: KeyValueStore): number {
  const current = Number.parseInt(store.getItem(READING_COUNT_KEY) ?? "0", 10);
  return Number.isFinite(current) && current >= 0 ? current : 0;
}
