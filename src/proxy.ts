import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import type { SessionPayload } from "@/lib/jose";

// Routes accessible without authentication
const publicRoutes = ["/login", "/_next", "/api"];

// Routes requiring admin or super-admin role
const adminRoutes = ["/admin"];

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET environment variable");
  }
  return new TextEncoder().encode(secret);
}

async function verifySessionCookie(
  token: string,
): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret(), {
    algorithms: ["HS256"],
  });

  if (!payload.uid || !payload.role) {
    throw new Error("Invalid session payload: missing uid or role");
  }

  return payload as SessionPayload;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes (login, API, static assets)
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check session cookie for protected routes
  const sessionCookie = request.cookies.get("session")?.value;

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const payload = await verifySessionCookie(sessionCookie);

    // Check admin route access
    if (
      adminRoutes.some((route) => pathname.startsWith(route)) &&
      payload.role === "user"
    ) {
      // Redirect unauthorized users to dashboard home
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Clone request headers and add user info for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-uid", payload.uid);
    requestHeaders.set("x-user-role", payload.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    // Invalid or expired token
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
