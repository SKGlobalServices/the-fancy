import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/shared/lib/firebase-admin";

/**
 * Bootstrap: set the first super-admin user.
 * Only works if no users exist in the Firestore `users` collection yet.
 *
 * Call: POST /api/bootstrap
 * Body: { email: "your-email@example.com" }
 *
 * The user must already exist in Firebase Auth.
 */
export async function POST(request: Request) {
  try {
    const adminDb = getAdminDb();
    const snapshot = await adminDb.collection("users").limit(1).get();

    if (!snapshot.empty) {
      return NextResponse.json(
        { error: "Users already exist. Bootstrap is only for first-time setup." },
        { status: 400 },
      );
    }

    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 },
      );
    }

    const adminAuth = getAdminAuth();
    const user = await adminAuth.getUserByEmail(email);

    await adminDb.collection("users").doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || email.split("@")[0],
      role: "super-admin",
      createdAt: new Date().toISOString(),
      createdBy: "bootstrap",
    });

    return NextResponse.json({
      message: `User ${email} is now super-admin. Log out and log in again.`,
      uid: user.uid,
      role: "super-admin",
    });
  } catch (error) {
    console.error("Bootstrap error:", error);
    return NextResponse.json(
      { error: "Bootstrap failed. Check that the email exists in Firebase Auth." },
      { status: 500 },
    );
  }
}
