import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signSessionCookie } from "@/lib/jose";
import { verifyFirebaseToken } from "@/lib/verify-firebase-token";
import { getUserRole } from "@/features/auth/services/auth-service";

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid idToken" },
        { status: 400 },
      );
    }

    // Verify the Firebase ID token locally using Google's public JWKS keys.
    // No Admin SDK or service account permissions required.
    const decoded = await verifyFirebaseToken(idToken);

    // Read role from Firestore
    const role = await getUserRole(decoded.uid);

    // Sign a JWT session cookie
    const sessionToken = await signSessionCookie({
      uid: decoded.uid,
      role,
    });

    // Set httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      uid: decoded.uid,
      email: decoded.email,
      role,
    });
  } catch (error) {
    console.error("Session creation error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Session creation failed", detail: message },
      { status: 401 },
    );
  }
}
