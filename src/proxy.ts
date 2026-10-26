import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public subdomains served from a route of this app.
const SUBDOMAIN_PATHS: Record<string, string> = {
  spins: "/spins",
  spots: "/spots",
};
// Top-level dashboard routes that must not be treated as spin ids on the spins subdomain.
const APP_ROUTE_PREFIXES = [
  "/login",
  "/campaigns",
  "/drops",
  "/radio-monitor",
  "/payments",
  "/schedule",
  "/settings",
];

function getSubdomainPath(request: NextRequest) {
  const subdomain = (request.headers.get("host") ?? "").split(".")[0];
  return SUBDOMAIN_PATHS[subdomain];
}

function isAppRoute(pathname: string) {
  return APP_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// spins.arroweye.pro/        -> /spins
// spins.arroweye.pro/:id     -> /spins/:id
// spins.arroweye.pro/spins/* -> redirect to the prefix-less URL
// spots.arroweye.pro follows the same rules with /spots.
function handleSubdomainHost(request: NextRequest, basePath: string) {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();

  if (pathname === basePath || pathname.startsWith(`${basePath}/`)) {
    url.pathname = pathname.slice(basePath.length) || "/";
    return NextResponse.redirect(url, 308);
  }

  if (isAppRoute(pathname)) {
    return null;
  }

  url.pathname = pathname === "/" ? basePath : `${basePath}${pathname}`;
  return NextResponse.rewrite(url);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const subdomainPath = getSubdomainPath(request);
  if (subdomainPath) {
    const subdomainResponse = handleSubdomainHost(request, subdomainPath);
    if (subdomainResponse) {
      return subdomainResponse;
    }
  }

  const token = request.cookies.get("auth_token")?.value;
  const isPublicChartRoute =
    pathname === "/spins" ||
    pathname.startsWith("/spins/") ||
    pathname === "/spots";
  const isPublicSetupRoute = pathname === "/campaigns/setup";

  // The Spins shares, Spots rankings and campaign setup landing page are public.
  // Setup sub-routes remain protected because they create or fund campaigns.
  if (isPublicChartRoute || isPublicSetupRoute) {
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
