import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { getFirebaseAuth } from "@/shared/lib/firebase";
import { getFirebaseDb } from "@/shared/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { User, LoginCredentials, Role } from "../types";

function mapFirebaseUser(user: FirebaseUser, role: Role = "user"): User {
  return {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? user.email?.split("@")[0] ?? "Usuario",
    role,
  };
}

export async function loginUser(credentials: LoginCredentials): Promise<User> {
  const auth = getFirebaseAuth();
  const result = await signInWithEmailAndPassword(
    auth,
    credentials.email,
    credentials.password,
  );
  const role = await getUserRole(result.user.uid);
  return mapFirebaseUser(result.user, role);
}

export async function registerUser(
  credentials: LoginCredentials & { displayName: string },
): Promise<User> {
  const auth = getFirebaseAuth();
  const result = await createUserWithEmailAndPassword(
    auth,
    credentials.email,
    credentials.password,
  );
  await updateProfile(result.user, { displayName: credentials.displayName });
  return mapFirebaseUser(result.user);
}

export async function logoutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

export function onAuthChange(
  callback: (user: User | null) => void,
): () => void {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      // Return user with default role; the hook will fetch the actual role separately
      callback(mapFirebaseUser(firebaseUser));
    } else {
      callback(null);
    }
  });
}

export async function getUserRole(uid: string): Promise<Role> {
  const db = getFirebaseDb();
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return "user";
  }

  const data = docSnap.data();
  const role = data?.role as Role | undefined;

  if (role && ["super-admin", "admin", "user"].includes(role)) {
    return role;
  }

  return "user";
}

export async function getIdToken(): Promise<string | null> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch {
    return null;
  }
}
