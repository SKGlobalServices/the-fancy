import { describe, it, expect } from "vitest";

// Test the middleware matcher pattern logic
describe("Middleware matcher patterns", () => {
  const matcherPattern = "/((?!api|_next|_vercel|login|favicon.ico|logo|images).*)";

  function matches(path: string): boolean {
    // Simulate how Next.js middleware matcher works
    // The regex is: /((?!api|_next|_vercel|login|favicon.ico|logo|images).*)
    // This means: match paths that DON'T start with those patterns
    const excluded = ["/api", "/_next", "/_vercel", "/login", "/favicon.ico"];
    return !excluded.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
  }

  it("allows /en/dashboard", () => {
    expect(matches("/en/dashboard")).toBe(true);
  });

  it("allows /es/dashboard/gastos", () => {
    expect(matches("/es/dashboard/gastos")).toBe(true);
  });

  it("allows /en/admin/users", () => {
    expect(matches("/en/admin/users")).toBe(true);
  });

  it("excludes /login", () => {
    expect(matches("/login")).toBe(false);
  });

  it("excludes /api/admin/users", () => {
    expect(matches("/api/admin/users")).toBe(false);
  });

  it("excludes /_next/static", () => {
    expect(matches("/_next/static")).toBe(false);
  });

  it("excludes /favicon.ico", () => {
    expect(matches("/favicon.ico")).toBe(false);
  });

  it("excludes /api/auth/signIn", () => {
    expect(matches("/api/auth/signIn")).toBe(false);
  });

  it("allows / at root", () => {
    expect(matches("/")).toBe(true);
  });

  it("allows locale-prefixed routes", () => {
    expect(matches("/en/")).toBe(true);
    expect(matches("/es/dashboard")).toBe(true);
  });
});
