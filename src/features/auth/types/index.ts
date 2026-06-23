export type Role = "super-admin" | "admin" | "user";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = LoginCredentials & {
  displayName: string;
};

export interface CreateUserRequest {
  email: string;
  password: string;
  displayName: string;
  role: Role;
}

export interface CreateUserResponse {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
}

export const ROLE_HIERARCHY: Record<Role, Role[]> = {
  "super-admin": ["super-admin", "admin", "user"],
  admin: ["user"],
  user: [],
};

export function canCreateRole(creatorRole: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[creatorRole]?.includes(targetRole) ?? false;
}

export function isAdminOrAbove(role: Role): boolean {
  return role === "admin" || role === "super-admin";
}
