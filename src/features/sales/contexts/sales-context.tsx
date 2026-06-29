"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useSales, type UseSalesReturn } from "../hooks/use-sales";

const SalesContext = createContext<UseSalesReturn | null>(null);

export function SalesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const salesData = useSales(user?.uid ?? "");

  return (
    <SalesContext.Provider value={salesData}>
      {children}
    </SalesContext.Provider>
  );
}

export function useSalesContext(): UseSalesReturn {
  const ctx = useContext(SalesContext);
  if (!ctx) {
    throw new Error("useSalesContext debe usarse dentro de un <SalesProvider>");
  }
  return ctx;
}
