import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth
  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api");

  // Skip middleware for public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // TODO: Implement proper auth check with Firebase Auth session cookie
  // For now, allow all requests during development
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
