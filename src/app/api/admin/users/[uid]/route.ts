import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyFirebaseToken } from "@/lib/verify-firebase-token";
import { getAdminDb } from "@/shared/lib/firebase-admin";
import { getAdminAuth } from "@/shared/lib/firebase-admin-auth";
import type { Role } from "@/features/auth/types";

// Zod schema for update-user request body
const updateUserSchema = z.object({
  displayName: z.string().min(1, "Display name is required").optional(),
  role: z.enum(["super-admin", "admin", "user"] as const).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  try {
    const { uid } = await params;

    // --- Authenticate via Authorization header ---
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 },
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    let requesterUid: string;

    try {
      const decoded = await verifyFirebaseToken(idToken);
      requesterUid = decoded.uid;
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    // --- Check requester role from Firestore ---
    const adminDb = getAdminDb();
    const requesterDoc = await adminDb.collection("users").doc(requesterUid).get();
    const requesterData = requesterDoc.data();
    const requesterRole = (requesterData?.role as Role) ?? "user";

    if (requesterRole !== "super-admin") {
      return NextResponse.json(
        { error: "Forbidden", message: "Only super-admins can edit users" },
        { status: 403 },
      );
    }

    // --- Check target user exists ---
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "Not found", message: "User not found" },
        { status: 404 },
      );
    }

    const userData = userDoc.data()!;

    // --- Validate request body ---
    const parseResult = updateUserSchema.safeParse(await request.json());
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const updateData = parseResult.data;

    // Build the Firestore update payload
    const firestoreUpdate: Record<string, unknown> = {};
    if (updateData.displayName !== undefined) {
      firestoreUpdate.displayName = updateData.displayName;
    }
    if (updateData.role !== undefined) {
      firestoreUpdate.role = updateData.role;
    }

    // If nothing to update, return the current user data
    if (Object.keys(firestoreUpdate).length === 0) {
      return NextResponse.json(
        {
          uid: userDoc.id,
          email: userData.email ?? "",
          displayName: userData.displayName ?? "",
          role: userData.role ?? "user",
        },
        { status: 200 },
      );
    }

    // --- Update Firestore document ---
    await adminDb.collection("users").doc(uid).update(firestoreUpdate);

    // If displayName changed, also update Firebase Auth
    if (updateData.displayName !== undefined) {
      try {
        const adminAuth = getAdminAuth();
        await adminAuth.updateUser(uid, { displayName: updateData.displayName });
      } catch (err) {
        console.error("Failed to update Firebase Auth displayName:", err);
        // Non-critical — Firestore is the source of truth for displayName
      }
    }

    // Return the updated user
    const updatedDoc = await adminDb.collection("users").doc(uid).get();
    const updatedData = updatedDoc.data()!;

    return NextResponse.json(
      {
        uid: updatedDoc.id,
        email: updatedData.email ?? "",
        displayName: updatedData.displayName ?? "",
        role: updatedData.role ?? "user",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Admin update user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
