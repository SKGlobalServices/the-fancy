import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { getFirebaseAuth } from "@/shared/lib/firebase";
import type { User, LoginCredentials } from "../types";

function mapFirebaseUser(user: FirebaseUser): User {
  return {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? user.email?.split("@")[0] ?? "Usuario",
  };
}

export async function loginUser(credentials: LoginCredentials): Promise<User> {
  const auth = getFirebaseAuth();
  const result = await signInWithEmailAndPassword(
    auth,
    credentials.email,
    credentials.password,
  );
  return mapFirebaseUser(result.user);
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
      callback(mapFirebaseUser(firebaseUser));
    } else {
      callback(null);
    }
  });
}
