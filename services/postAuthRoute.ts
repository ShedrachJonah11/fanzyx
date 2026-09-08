import type { MeOut } from "./dtos";

/**
 * Where to send a user right after a successful auth (login, signup, Google).
 *
 * Rules:
 * - Creator without onboardingCompletedAt → /onboarding/creator (always;
 *   ignores `next` because they can't use the app until they finish).
 * - Creator with onboarding done → `next` if provided, else /dashboard.
 * - Admin/moderator → /admin.
 * - Fan (default) → `next` if provided, else /feed.
 */
export function postAuthRoute(user: MeOut, next?: string | null): string {
  const nextPath = next && next.trim().length > 0 ? next : undefined;

  if (user.role === "creator") {
    if (!user.onboardingCompletedAt) return "/onboarding/creator";
    return nextPath ?? "/dashboard";
  }

  if (user.role === "admin" || user.role === "moderator") {
    return "/admin";
  }

  return nextPath ?? "/feed";
}
