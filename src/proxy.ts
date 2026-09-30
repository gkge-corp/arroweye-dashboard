import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SPINS_PATH = "/spins";
// Top-level dashboard routes that must not be treated as spin ids on the spins subdomain.
const APP_ROUTE_PREFIXES = [
  "/login",
  "/campaigns",
  "/drops",
  "/payments",
  "/schedule",
  "/settings",
];

function isSpinsHost(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  return host.startsWith("spins.");
}

function isAppRoute(pathname: string) {
  return APP_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// spins.arroweye.pro/        -> /spins
// spins.arroweye.pro/:id     -> /spins/:id
// spins.arroweye.pro/spins/* -> redirect to the prefix-less URL
function handleSpinsHost(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();

  if (pathname === SPINS_PATH || pathname.startsWith(`${SPINS_PATH}/`)) {
    url.pathname = pathname.slice(SPINS_PATH.length) || "/";
    return NextResponse.redirect(url, 308);
  }

  if (isAppRoute(pathname)) {
    return null;
  }

  url.pathname = pathname === "/" ? SPINS_PATH : `${SPINS_PATH}${pathname}`;
  return NextResponse.rewrite(url);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isSpinsHost(request)) {
    const spinsResponse = handleSpinsHost(request);
    if (spinsResponse) {
      return spinsResponse;
    }
  }

  const token = request.cookies.get("auth_token")?.value;
  const isPublicSpinsRoute =
    pathname === "/spins" || pathname.startsWith("/spins/");
  const isPublicSetupRoute = pathname === "/campaigns/setup";

  // The Spins shares and campaign setup landing page are public.
  // Setup sub-routes remain protected because they create or fund campaigns.
  if (isPublicSpinsRoute || isPublicSetupRoute) {
    return NextResponse.next();
  }

  // If trying to access the login page and we have a token, redirect to dashboard
  if (pathname === "/login") {
    if (token) {
      return NextResponse.redirect(new URL("/campaigns", request.url));
    }
    return NextResponse.next();
  }

  // If trying to access "/" specifically, redirect to dashboard if logged in, otherwise to login page
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/campaigns", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // For any other page (e.g. dashboard routes), if not logged in, redirect to login page
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - files with extensions (e.g. png, svg, webp)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)",
  ],
};
