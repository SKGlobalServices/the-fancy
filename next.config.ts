import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Prevent bundling firebase-admin — it depends on ESM-only modules (jose via jwks-rsa)
  // that break when bundled by Turbopack in serverless environments (Vercel).
  serverExternalPackages: ["firebase-admin"],
};

export default withNextIntl(nextConfig);
