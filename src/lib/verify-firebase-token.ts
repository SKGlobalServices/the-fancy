import "server-only";

import { createRemoteJWKSet, jwtVerify } from "jose";

const PROJECT_ID = process.env.FIREBASE_ADMIN_PROJECT_ID;

// Google's public JWKS endpoint for Firebase Auth tokens
const JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(JWKS_URL));
  }
  return jwks;
}

export interface FirebaseTokenPayload {
  uid: string;
  email?: string;
  email_verified?: boolean;
  auth_time?: number;
}

/**
 * Verify a Firebase ID token locally using Google's public JWKS endpoint.
 * No Admin SDK or service account permissions needed.
 *
 * The `aud` claim must match the Firebase project ID,
 * and the `iss` claim must be "https://securetoken.google.com/<projectId>".
 */
export async function verifyFirebaseToken(
  idToken: string,
): Promise<FirebaseTokenPayload> {
  if (!PROJECT_ID) {
    throw new Error("Missing FIREBASE_ADMIN_PROJECT_ID environment variable");
  }

  const { payload } = await jwtVerify(idToken, getJwks(), {
    algorithms: ["RS256"],
    issuer: `https://securetoken.google.com/${PROJECT_ID}`,
    audience: PROJECT_ID,
  });

  if (!payload.sub) {
    throw new Error("Invalid Firebase token: missing subject (uid)");
  }

  return {
    uid: payload.sub,
    email: payload.email as string | undefined,
    email_verified: payload.email_verified as boolean | undefined,
    auth_time: payload.auth_time as number | undefined,
  };
}
