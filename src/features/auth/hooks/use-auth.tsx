"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { loginUser, logoutUser, onAuthChange } from "../services/auth-service";
import type { User, LoginCredentials, AuthState } from "../types";

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setState({ user, isLoading: false, error: null });
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await loginUser(credentials);
      setState({ user, isLoading: false, error: null });
    } catch (err) {
      const message =
        err instanceof Error ? translateFirebaseError(err.message) : "Error al iniciar sesión";
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setState({ user: null, isLoading: false, error: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}

function translateFirebaseError(code: string): string {
  if (code.includes("auth/invalid-credential"))
    return "Correo o contraseña incorrectos";
  if (code.includes("auth/user-not-found"))
    return "No encontramos una cuenta con ese correo";
  if (code.includes("auth/wrong-password"))
    return "Contraseña incorrecta";
  if (code.includes("auth/invalid-email"))
    return "El correo electrónico no es válido";
  if (code.includes("auth/too-many-requests"))
    return "Demasiados intentos. Esperá unos minutos y volvé a intentar";
  if (code.includes("auth/network-request-failed"))
    return "Error de conexión. Revisá tu internet";
  if (code.includes("auth/user-disabled"))
    return "Esta cuenta fue deshabilitada";
  if (code.includes("auth/email-already-in-use"))
    return "Ya existe una cuenta con ese correo";
  if (code.includes("auth/weak-password"))
    return "La contraseña debe tener al menos 6 caracteres";
  return "Ocurrió un error. Intentá de nuevo";
}
