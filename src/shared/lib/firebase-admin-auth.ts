import "server-only";

import { initializeApp, getApps, cert, type AppOptions, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

function getAdminConfig(): AppOptions {
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;

  if (!clientEmail || !privateKey || !projectId) {
    throw new Error(
      "Missing Firebase Admin environment variables: FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_ADMIN_PROJECT_ID",
    );
  }

  const serviceAccount: ServiceAccount = {
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
    projectId,
  };

  return {
    credential: cert(serviceAccount),
    projectId,
  };
}

let adminAuth: Auth | undefined;

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    const apps = getApps();
    const app = apps.length === 0 ? initializeApp(getAdminConfig()) : apps[0]!;

    adminAuth = getAuth(app);
  }
  return adminAuth;
}
