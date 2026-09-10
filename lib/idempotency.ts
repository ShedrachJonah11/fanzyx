/**
 * Generate a fresh idempotency key per user click. Do NOT reuse across a
 * new action — only across retries of the same action (e.g. after a
 * transient network failure).
 */
export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
