"use client";

import { AuthProvider } from "@/features/auth/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
      />
    </AuthProvider>
  );
}
