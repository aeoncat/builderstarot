/**
 * Owner-only authorization for the validation dashboard and exports.
 *
 * Gated by the OWNER_EMAILS environment variable (comma-separated allowlist),
 * checked server-side against the authenticated session. Never relies on
 * hiding links.
 */

export function isOwnerEmail(email: string | null | undefined, allowlist: string | undefined): boolean {
  if (!email || !allowlist) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return allowlist
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
}
