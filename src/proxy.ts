import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { routing } from "./i18n/routing";
import type { SessionPayload } from "@/lib/jose";

// Routes accessible without authentication
const publicRoutes = ["/login", "/_next", "/api"];

// Routes requiring admin or super-admin role
const adminRoutes = ["/admin"];

const intlMiddleware = createMiddleware(routing);

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

  // Allow public routes (login, API, static assets) — no i18n/auth needed
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 1. Run next-intl middleware for locale detection/redirect
  const intlResponse = await intlMiddleware(request);

  // If intl middleware returned a redirect (e.g. / -> /en), return it early
  if (intlResponse && intlResponse.status !== 200) {
    return intlResponse;
  }

  // 2. Auth check for protected routes
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

    // Build response, carrying over intl middleware headers (e.g. Vary: Accept-Language)
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    if (intlResponse) {
      intlResponse.headers.forEach((value, key) => {
        response.headers.set(key, value);
      });
    }

    return response;
  } catch {
    // Invalid or expired token
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:webp|png|jpg|jpeg|svg|gif|ico|woff2?|ttf|eot|css|js)$).*)"],
};
