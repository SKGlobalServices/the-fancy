import "server-only";

import { getAdminDb } from "@/shared/lib/firebase-admin";
import type { Role } from "../types";

/**
 * Read a user's role from Firestore using the Admin SDK.
 * Admin SDK bypasses Security Rules, so this works server-side
 * regardless of the client-side rules configuration.
 */
export async function getUserRoleAdmin(uid: string): Promise<Role> {
  const db = getAdminDb();
  const docRef = db.collection("users").doc(uid);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return "user";
  }

  const data = docSnap.data();
  const role = data?.role as Role | undefined;

  if (role && ["super-admin", "admin", "user"].includes(role)) {
    return role;
  }

  return "user";
}
