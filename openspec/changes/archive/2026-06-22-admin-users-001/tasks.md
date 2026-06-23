# Tasks: Admin Users & Authorization

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~450-550 |
| 400-line budget risk | Low (accepted 800) |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Foundation & Dependencies

- [x] 1.1 Install `pnpm add firebase-admin jose`
- [x] 1.2 Modify `src/features/auth/types/index.ts` — add `Role` type, update `User` interface with `role` field, add `ROLE_HIERARCHY` const and `CreateUserRequest`/`CreateUserResponse` interfaces
- [x] 1.3 Create `src/shared/lib/firebase-admin.ts` — init Firebase Admin SDK from `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`, `FIREBASE_ADMIN_PROJECT_ID` env vars; export `getAdminAuth()` and `getAdminDb()`
- [x] 1.4 Create `src/lib/jose.ts` — export `signSessionCookie(payload)` and `verifySessionCookie(token)` using `jose` with a secret from `JWT_SECRET` env var
- [x] 1.5 Modify `src/features/auth/services/auth-service.ts` — add `getUserRole(uid: string): Promise<Role>` that reads Firestore doc `users/{uid}` and defaults to `"user"`; export it
- [x] 1.6 Add env vars to `.env.local` — `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`, `FIREBASE_ADMIN_PROJECT_ID`, `JWT_SECRET`

## Phase 2: Session API & Middleware

- [x] 2.1 Create `src/app/api/auth/session/route.ts` — `POST` handler: verify Firebase ID token with Admin SDK, read role from Firestore via `getUserRole()`, call `signSessionCookie({ uid, role })`, set httpOnly secure cookie `session` with max-age, return 200
- [x] 2.2 Create `src/middleware.ts` — match `/(dashboard)/*`, read `session` cookie, call `verifySessionCookie()`, on failure redirect `/login`; extract `role` from payload, if `user` role accessing `/admin/*` redirect/block; pass cookie through `Request` for downstream use
- [x] 2.3 Modify `src/features/auth/hooks/use-auth.tsx` — on auth state change, fetch Firestore role via `getUserRole(uid)`, expose `role` in `AuthContextValue`; call `POST /api/auth/session` after login to establish the cookie

## Phase 3: Dashboard Layout & Sidebar

- [x] 3.1 Create `src/features/auth/components/sidebar.tsx` — dashboard sidebar with Lucide icons: Dashboard (layout-dashboard) link, Usuarios (users) link (hidden when `role === "user"`), logout button; use `useAuth()` to read role
- [x] 3.2 Create `src/app/(dashboard)/layout.tsx` — server layout that wraps children with sidebar layout; render `<Sidebar>` and main content area
- [x] 3.3 Create `src/app/(dashboard)/page.tsx` — dashboard home placeholder with welcome heading

## Phase 4: Admin Users API & UI

- [x] 4.1 Create `src/app/api/admin/users/route.ts` — `POST` handler: verify `Authorization: Bearer` token with Admin SDK, check role hierarchy (admin cannot create admin/super-admin), Zod-validate body (`email`, `password`, `displayName`, `role`), call `admin.auth().createUser()`, write Firestore doc `users/{uid}` with `createdAt` timestamp and `createdBy`, return 200 with user data; handle errors: 401, 400, 403, 409
- [x] 4.2 Create `src/features/admin-users/components/create-user-form.tsx` — client form with email, password, displayName, role selector (filtered by `ROLE_HIERARCHY` for current user); submit POST to `/api/admin/users`; show success/error feedback via toast or inline message
- [x] 4.3 Create `src/app/(dashboard)/admin/users/page.tsx` — page that renders `<CreateUserForm />`, uses `useAuth()` for auth context
