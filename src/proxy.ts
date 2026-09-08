import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Next.js 16 renamed the `middleware.ts` convention to `proxy.ts` (same behavior,
// new file/export name — see AGENTS.md). This is only the OPTIMISTIC, first-pass
// route guard: it reads the session from the JWT cookie and redirects unauthenticated
// users away from protected pages. It never makes the authorization decision on its
// own — every service-layer function re-checks role/scope itself (see
// docs/ARCHITECTURE.md §Authentication & Authorization and src/lib/auth-guard.ts).

const PUBLIC_ROUTES = ["/login"];

export default auth((req) => {
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );
  const isLoggedIn = !!req.auth;

  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
