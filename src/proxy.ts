import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const APP_ORIGIN = "https://studio.arroweye.pro";

// Old standalone domains, now pages of this app.
const SUBDOMAIN_PATHS: Record<string, string> = {
  spins: "/spins",
  spots: "/spots",
};

// spins.arroweye.pro/:path -> studio.arroweye.pro/spins/:path (same for spots).
function getSubdomainRedirect(request: NextRequest) {
  const subdomain = (request.headers.get("host") ?? "").split(".")[0];
  const basePath = SUBDOMAIN_PATHS[subdomain];
  if (!basePath) return null;

  const { pathname, search } = request.nextUrl;
  let path = `${basePath}${pathname}`;
  if (pathname === "/") path = basePath;
  if (pathname === basePath || pathname.startsWith(`${basePath}/`)) {
    path = pathname;
  }

  return NextResponse.redirect(`${APP_ORIGIN}${path}${search}`, 308);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const subdomainRedirect = getSubdomainRedirect(request);
  if (subdomainRedirect) {
    return subdomainRedirect;
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
