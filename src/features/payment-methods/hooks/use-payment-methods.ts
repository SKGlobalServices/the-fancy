"use client";

import { useState, useEffect, useCallback } from "react";
import { getFirebaseDb } from "@/shared/lib/firebase";
import {
  listenPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "../services/payment-method-service";
import type { PaymentMethod } from "../types";

export interface UsePaymentMethodsReturn {
  methods: PaymentMethod[];
  activeMethods: PaymentMethod[];
  isLoading: boolean;
  error: string | null;
  addMethod: (data: { key: string; name: string; feePct: number; sortOrder?: number; isActive?: boolean }) => Promise<void>;
  editMethod: (key: string, data: { name: string; feePct: number; sortOrder?: number; isActive?: boolean }) => Promise<void>;
  removeMethod: (key: string) => Promise<void>;
}

export function usePaymentMethods(): UsePaymentMethodsReturn {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirebaseDb();

    const unsubscribe = listenPaymentMethods(
      db,
      (data) => {
        setMethods(data);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const activeMethods = methods.filter((m) => m.isActive);

  const addMethod = useCallback(
    async (data: { key: string; name: string; feePct: number; sortOrder?: number; isActive?: boolean }): Promise<void> => {
      const db = getFirebaseDb();
      await createPaymentMethod(db, data.key, data);
    },
    [],
  );

  const editMethod = useCallback(
    async (key: string, data: { name: string; feePct: number; sortOrder?: number; isActive?: boolean }): Promise<void> => {
      const db = getFirebaseDb();
      await updatePaymentMethod(db, key, data);
    },
    [],
  );

  const removeMethod = useCallback(
    async (key: string): Promise<void> => {
      const db = getFirebaseDb();
      await deletePaymentMethod(db, key);
    },
    [],
  );

  return {
    methods,
    activeMethods,
    isLoading,
    error,
    addMethod,
    editMethod,
    removeMethod,
  };
}
