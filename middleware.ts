import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "fanzyx.at";

/**
 * Edge gate for protected routes. Presence of the fanzyx.at cookie means "we
 * think we have a session"; if it's actually expired or invalid, the app's
 * 401-refresh interceptor + AuthGate handle it after render.
 */
export function middleware(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (token) return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/feed/:path*",
    "/wallet/:path*",
    "/subscriptions/:path*",
    "/messages/:path*",
    "/settings/:path*",
    "/saved/:path*",
    "/transactions/:path*",
    "/onboarding/:path*",
  ],
};
