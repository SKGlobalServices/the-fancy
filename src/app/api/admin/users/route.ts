import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuth, getAdminDb } from "@/shared/lib/firebase-admin";
import { verifyFirebaseToken } from "@/lib/verify-firebase-token";
import type { Role } from "@/features/auth/types";
import { canCreateRole } from "@/features/auth/types";
import { FieldValue } from "firebase-admin/firestore";

// Zod schema for create-user request body
const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(1, "Display name is required"),
  role: z.enum(["super-admin", "admin", "user"] as const),
});

export async function POST(request: Request) {
  try {
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
    let requesterRole: Role;

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
    requesterRole = (requesterData?.role as Role) ?? "user";

    // --- Validate request body ---
    const parseResult = createUserSchema.safeParse(await request.json());
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const { email, password, displayName, role: targetRole } = parseResult.data;

    // --- Check role hierarchy ---
    if (!canCreateRole(requesterRole, targetRole)) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: `Role '${requesterRole}' cannot create users with role '${targetRole}'`,
        },
        { status: 403 },
      );
    }

    // --- Create Firebase Auth user ---
    const adminAuth = getAdminAuth();
    let newUser;
    try {
      newUser = await adminAuth.createUser({
        email,
        password,
        displayName,
      });
    } catch (err: unknown) {
      if (err instanceof Error && "code" in err) {
        const firebaseErr = err as { code?: string; message?: string };
        if (firebaseErr.code === "auth/email-already-exists") {
          return NextResponse.json(
            { error: "Conflict", message: "A user with this email already exists" },
            { status: 409 },
          );
        }
      }
      throw err;
    }

    // --- Write Firestore document ---
    await adminDb.collection("users").doc(newUser.uid).set({
      uid: newUser.uid,
      email,
      displayName,
      role: targetRole,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: requesterUid,
    });

    return NextResponse.json(
      {
        uid: newUser.uid,
        email,
        displayName,
        role: targetRole,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Admin create user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
