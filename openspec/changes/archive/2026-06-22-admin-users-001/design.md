# Design: Admin Users & Authorization

## Technical Approach

Extend the existing auth system with roles, add a server-side Firebase Admin SDK for API routes, protect `/(dashboard)/*` via Edge middleware with a signed JWT cookie, and build the admin users interface atop shadcn/ui components — all following the existing feature-first structure under `src/features/`.

The middleware challenge (Edge runtime, no Admin SDK) is solved by signing our own JWT cookie with `jose` after login. API routes use `firebase-admin` directly (Node.js runtime).

## Architecture Decisions

### Session & Middleware Strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| JWT cookie signed with `jose` | Extra dependency, cookie must be refreshed | **Chosen** — works in Edge runtime, full role validation in middleware |
| Firebase session cookie + Admin SDK in Edge | Admin SDK not fully Edge-compatible, experimental | Rejected — brittle |
| Client-side role check only | Spec requires middleware validation | Rejected — doesn't satisfy spec |
| No middleware, API-only checks | Dashboard pages unprotected | Rejected — unauthenticated users could load JS bundle |

**Rationale**: `jose` JWT in httpOnly cookie lets middleware verify auth + role without Admin SDK. Cookie is set by `/api/auth/session` after Firebase ID token verification.

### Role Storage: Custom Claims vs Firestore

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Firestore doc field | Read after every page load, but visible/manageable | **Chosen** — spec defines Firestore as source of truth |
| Firebase custom claims | Cached in token, but limited to 1000 bytes, harder to manage | Rejected — Firestore is the authoritative source per spec |

**Rationale**: Role is stored in Firestore `users/{uid}` document. `jose` cookie bakes in the role at session creation time. Custom claims add complexity without benefit here.

## Data Flow

```
Login (client-side Firebase Auth)
    │
    ├── onAuthStateChanged → fetch Firestore doc → User { uid, email, displayName, role }
    │
    └── POST /api/auth/session (with Firebase ID token)
            │
            ├── firebase-admin.verifyIdToken(token)
            ├── Read role from Firestore
            └── Set httpOnly cookie (signed JWT with jose)
                    │
                    ▼
            Middleware (Edge runtime)
                    │
                    ├── Read cookie, verify JWT signature
                    ├── If missing → redirect /login
                    └── If role insufficient → 403 page
                            │
                            ▼
                    Dashboard Layout / Admin Page
                            │
                            ├── AuthProvider provides { user, role }
                            └── Role-gated UI (sidebar links, form role options)

POST /api/admin/users
    │
    ├── Read Authorization: Bearer {ID token}
    ├── firebase-admin.verifyIdToken(token)
    ├── Check role hierarchy (admin cannot create admin/super-admin)
    ├── Zod validate body
    ├── firebase-admin.auth().createUser(...)
    ├── Firestore doc: users/{uid}
    └── Return { uid, email, displayName, role }
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/features/auth/types/index.ts` | Modify | Add `Role` type, add `role` to `User` interface |
| `src/features/auth/services/auth-service.ts` | Modify | Add `getUserRole(uid)` Firestore query, export it |
| `src/features/auth/hooks/use-auth.tsx` | Modify | Fetch role from Firestore in `onAuthChange`, expose via context |
| `src/shared/lib/firebase-admin.ts` | Create | Initialize firebase-admin with service account env vars |
| `src/app/api/auth/session/route.ts` | Create | Exchange ID token for signed JWT cookie (Node.js) |
| `src/middleware.ts` | Create | Verify cookie, redirect if missing/unauthorized (Edge) |
| `src/app/(dashboard)/layout.tsx` | Create | Sidebar layout with role-gated nav links |
| `src/app/(dashboard)/page.tsx` | Create | Dashboard home placeholder |
| `src/app/(dashboard)/admin/users/page.tsx` | Create | User creation form with role-gated options |
| `src/app/api/admin/users/route.ts` | Create | Create user: auth, role check, Zod, Firebase + Firestore |
| `src/lib/jose.ts` | Create | `signSessionCookie()` / `verifySessionCookie()` helpers |
| `src/features/auth/components/sidebar.tsx` | Create | Dashboard sidebar (Lucide icons, role-gated links) |
| `src/features/admin-users/components/create-user-form.tsx` | Create | Form with email, password, displayName, role selector |
| `.env.local` | Modify | Add `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`, `FIREBASE_ADMIN_PROJECT_ID` |

## Interfaces / Contracts

```typescript
// src/features/auth/types/index.ts
export type Role = "super-admin" | "admin" | "user";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
}

// Request body for POST /api/admin/users
export interface CreateUserRequest {
  email: string;      // Zod: z.string().email()
  password: string;   // Zod: z.string().min(6)
  displayName: string; // Zod: z.string().min(1)
  role: Role;          // Zod: z.enum(["super-admin", "admin", "user"])
}

// Response for POST /api/admin/users
export interface CreateUserResponse {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
}

// Role hierarchy for validation
export const ROLE_HIERARCHY: Record<Role, Role[]> = {
  "super-admin": ["super-admin", "admin", "user"],
  admin: ["user"],
  user: [],
};
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Zod schemas, role hierarchy logic | Pure functions, no mocking needed |
| Unit | `jose` helpers (sign/verify) | Unit test with known payloads |
| Integration | `POST /api/admin/users` | Supertest or fetch against API route with mocked Admin SDK |
| Integration | Middleware redirect logic | Next.js `next-test-utils` or manual curl verification |
| E2E | Full login → session → dashboard → create user flow | Playwright (no infra yet) |

**Note**: No test runner is installed (`testing.runner: none` in config). Tests are scoped to what can be verified manually or via TypeScript type checks until a runner is chosen.

## Migration / Rollout

No migration required for existing users — missing `role` field defaults to `"user"` in the auth service when fetching from Firestore.

## Open Questions

- [ ] Should the middleware role check redirect to a specific 403 page or just `/login`?
- [ ] Does the existing Firebase project have a service account JSON ready, or do we generate one?
