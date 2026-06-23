# SDD Proposal: Módulo Admin — Roles, Sidebar y Creación de Usuarios

## Change ID: `admin-users-001`

---

## 1. Problem Statement

El sistema actual tiene autenticación básica con Firebase Auth pero no tiene:
- Sistema de roles para controlar acceso
- Una interfaz de navegación (sidebar) para los módulos del sistema
- Forma de crear usuarios desde el sistema (solo existe registro público)
- Protección de rutas por rol

## 2. Scope

### In Scope (v1)
- Definir 3 roles: `super-admin`, `admin`, `user`
- Almacenar roles en Firestore (colección `users`)
- API route `/api/admin/users` para crear usuarios via Firebase Admin SDK
- Dashboard layout con sidebar global para usuarios autenticados
- Página `/admin/users` para gestión de usuarios
- Middleware para proteger rutas admin
- Regla jerárquica: super-admin crea admins, admin crea users

### Out of Scope (v1)
- Edición/eliminación de usuarios
- Dashboard principal con métricas
- Otros módulos del negocio (gastos, ventas, etc.)
- Tests automatizados (no hay infraestructura de testing)

## 3. User Roles & Permissions

| Rol | Permisos |
|---|---|
| `super-admin` | Acceso total. Crea admins y super-admins. Ve todo. |
| `admin` | Crea usuarios regulares. Accede a módulos operativos. |
| `user` | Solo puede ver su propio perfil y registrar su trabajo diario. |

## 4. Technical Approach

### Stack additions
- `firebase-admin` SDK para el API route
- Next.js API Route (App Router) para `POST /api/admin/users`
- Next.js Middleware para protección de rutas
- Dashboard layout en `src/app/(dashboard)/` con sidebar

### Data Model (Firestore)
```
/users/{uid}
  uid: string
  email: string
  displayName: string
  role: "super-admin" | "admin" | "user"
  createdAt: timestamp
  createdBy: string (uid de quien lo creó)
```

### Route Design
```
/(auth)/login          → Login público
/(dashboard)/          → Layout protegido con sidebar
/(dashboard)/admin/users → Gestión de usuarios (super-admin y admin)
```

### API Design
```
POST /api/admin/users
  Headers: Authorization (token de Firebase)
  Body: { email, password, displayName, role }
  Response: { uid, email, displayName, role }
```

## 5. Risks

| Risk | Mitigación |
|---|---|
| Firebase Admin SDK necesita credenciales de service account | Agregar a .env.local, documentar |
| Sin tests, cambios manuales propensos a error | Aceptado por ahora. Próximo cambio: agregar testing infra |
| Middleware de Next.js necesita configurar matcher | Usar `matcher` en `middleware.ts` para rutas protegidas |
| Token de Firebase debe validarse en API route | Usar `admin.auth().verifyIdToken()` |

## 6. Module Links (Sidebar - v1)

Para el sidebar, los módulos visibles serán:
- **Dashboard** → `/` (placeholder)
- **Usuarios** → `/admin/users` (super-admin y admin)
- Más módulos se agregan cuando se implementen

## 7. Dependencies

- `npm install firebase-admin`
- Variables de entorno: `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`, `FIREBASE_ADMIN_PROJECT_ID`
