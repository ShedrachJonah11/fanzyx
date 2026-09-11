import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "fanzyx.at";

/**
 * Paths on the main domain that require an authenticated session. The full
 * app/admin tree is gated separately via the admin subdomain rewrite below.
 */
const AUTHED_PATH_PREFIXES = [
  "/dashboard",
  "/feed",
  "/wallet",
  "/subscriptions",
  "/messages",
  "/notifications",
  "/settings",
  "/saved",
  "/transactions",
  "/onboarding",
];

function needsAuth(pathname: string) {
  return AUTHED_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

/**
 * `admin.localhost` (dev) and `admin.fanzyx.com` (prod). Strips any port and
 * lower-cases before checking. Modern browsers resolve `*.localhost` → 127.0.0.1
 * without needing /etc/hosts changes.
 */
function isAdminHost(host: string | null): boolean {
  if (!host) return false;
  const h = host.split(":")[0].toLowerCase();
  return h === "admin.localhost" || h.startsWith("admin.");
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get("host");
  const pathname = url.pathname;

  /* ── Admin subdomain ────────────────────────────────
     Everything on `admin.*` is served from the app/admin route tree.
     Rewrite so that visiting admin.localhost/foo internally maps to
     /admin/foo — clean URL bar, single Next.js app. */
  if (isAdminHost(host)) {
    if (pathname.startsWith("/admin")) return NextResponse.next();

    const token = req.cookies.get(AUTH_COOKIE)?.value;
    const isPublicAdminPath =
      pathname === "/login" || pathname.startsWith("/login/");
    if (!token && !isPublicAdminPath) {
      const loginUrl = url.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = `?next=${encodeURIComponent(pathname + url.search)}`;
      // Login lives inside the admin tree too — rewrite so we don't jump host.
      return NextResponse.rewrite(
        Object.assign(loginUrl.clone(), {
          pathname: `/admin${loginUrl.pathname}`,
        })
      );
    }

    const rewritten = url.clone();
    rewritten.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(rewritten);
  }

  /* ── Main domain ────────────────────────────────────
     /admin/* is admin-subdomain-only — hide it from the public site. */
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return new NextResponse(null, { status: 404 });
  }

  if (needsAuth(pathname)) {
    const token = req.cookies.get(AUTH_COOKIE)?.value;
    if (!token) {
      const loginUrl = url.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = `?next=${encodeURIComponent(pathname + url.search)}`;
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  /* Run on every path except static assets + Next internals. Hostname isn't
     matchable here so we filter inside the middleware. */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot|map)$).*)",
  ],
};
