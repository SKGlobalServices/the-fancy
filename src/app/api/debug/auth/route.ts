import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    // 1. Check env vars (mask private key)
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const jwtSecret = process.env.JWT_SECRET;

    results.envVars = {
      FIREBASE_ADMIN_CLIENT_EMAIL: clientEmail ?? "❌ NOT SET",
      FIREBASE_ADMIN_PRIVATE_KEY: privateKey
        ? `✅ SET (${privateKey.length} chars, starts with: ${privateKey.trim().substring(0, 40)}...)`
        : "❌ NOT SET",
      FIREBASE_ADMIN_PROJECT_ID: projectId ?? "❌ NOT SET",
      JWT_SECRET: jwtSecret ? `✅ SET (${jwtSecret.length} chars)` : "❌ NOT SET",
    };

    if (!clientEmail || !privateKey || !projectId) {
      results.error = "Missing required env vars";
      return NextResponse.json(results, { status: 200 });
    }

    // 2. Show how the private key looks after sanitization (first/last 30 chars)
    const sanitized = privateKey
      .replace(/\\n/g, "\n")
      .replace(/^["']|["']$/g, "")
      .trim();

    const lines = sanitized.split("\n");
    results.privateKeyInfo = {
      rawStart: privateKey.substring(0, 30),
      rawEnd: privateKey.substring(privateKey.length - 30),
      rawHasNewlines: privateKey.includes("\n"),
      rawHasLiteralN: privateKey.includes("\\n"),
      sanitizedStart: sanitized.substring(0, 30),
      sanitizedEnd: sanitized.substring(sanitized.length - 30),
      sanitizedLineCount: lines.length,
      sanitizedFirstLine: lines[0],
      sanitizedLastLine: lines[lines.length - 1],
      sanitizedHasTrailingQuote: sanitized.endsWith('"') || sanitized.endsWith("'"),
    };

    // 3. Try to initialize Firebase Admin
    try {
      const serviceAccount = {
        clientEmail,
        privateKey: sanitized,
        projectId,
      };

      const apps = getApps();
      const app =
        apps.length === 0
          ? initializeApp({ credential: cert(serviceAccount), projectId })
          : apps[0]!;

      results.init = {
        success: true,
        appName: app.name,
        appsCount: getApps().length,
      };

      // 4. Try a simple Firestore operation
      try {
        const db = getFirestore(app);
        // Just try to list collections (non-empty check, no auth needed for this)
        const collections = await db.listCollections();
        const collectionIds = collections.map((c) => c.id);
        results.firestore = {
          success: true,
          collectionsCount: collectionIds.length,
          collectionIds,
        };
      } catch (fsError: unknown) {
        results.firestore = {
          success: false,
          error: fsError instanceof Error ? fsError.message : String(fsError),
          code: (fsError as { code?: unknown })?.code ?? null,
          details: (fsError as { details?: unknown })?.details ?? null,
        };
      }
    } catch (initError: unknown) {
      results.init = {
        success: false,
        error: initError instanceof Error ? initError.message : String(initError),
        code: (initError as { code?: unknown })?.code ?? null,
        stack: initError instanceof Error ? initError.stack?.split("\n").slice(0, 4).join("\n") : null,
      };
    }
  } catch (fatalError: unknown) {
    results.fatal = fatalError instanceof Error ? fatalError.message : String(fatalError);
  }

  return NextResponse.json(results, { status: 200 });
}
