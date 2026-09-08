export interface GoogleIdTokenClaims {
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  picture?: string;
  sub?: string;
}

/**
 * Decode a Google ID token JWT payload without verifying the signature.
 * Only use client-side for UX hints (e.g. pre-filling an email) — the backend
 * verifies the token before trusting anything.
 */
export function decodeGoogleIdToken(idToken: string): GoogleIdTokenClaims | null {
  try {
    const [, payload] = idToken.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as GoogleIdTokenClaims;
  } catch {
    return null;
  }
}
