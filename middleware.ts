import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const requiredPin = process.env.ACCESS_PIN?.trim();
  const { pathname } = request.nextUrl;

  // Case 1: No PIN is configured in the environment
  if (!requiredPin) {
    // If user accesses /pin when no PIN is required, redirect to home
    if (pathname === "/pin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Case 2: PIN is configured
  const pinCookie = request.cookies.get("task_board_pin")?.value;
  const isPinValid = pinCookie === requiredPin;

  // If already logged in and visiting /pin, redirect to board
  if (pathname === "/pin") {
    if (isPinValid) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // If PIN is not valid, redirect to /pin
  if (!isPinValid) {
    const url = request.nextUrl.clone();
    url.pathname = "/pin";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.png (favicons)
     * - manifest.webmanifest (PWA manifest)
     * - robots.txt, sitemap.xml
     * - Static asset files (.png, .jpg, .svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
