"use client";

import { useState, useEffect, useCallback } from "react";
import { getFirebaseDb } from "@/shared/lib/firebase";
import {
  listenServiceTypes,
  createServiceType,
  updateServiceType,
  deleteServiceType,
} from "../services/service-type-service";
import type { ServiceType } from "../types";

export interface UseServiceTypesReturn {
  types: ServiceType[];
  isLoading: boolean;
  error: string | null;
  addType: (data: { name: string; areaId: string; price: number; isMakeup?: boolean }) => Promise<string>;
  editType: (id: string, data: { name?: string; areaId?: string; price?: number; isMakeup?: boolean }) => Promise<void>;
  removeType: (id: string) => Promise<void>;
}

export function useServiceTypes(
  userId: string,
): UseServiceTypesReturn {
  const [types, setTypes] = useState<ServiceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirebaseDb();

    const unsubscribe = listenServiceTypes(
      db,
      (data) => {
        setTypes(data);
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

  const addType = useCallback(
    async (data: { name: string; areaId: string; price: number; isMakeup?: boolean }): Promise<string> => {
      const db = getFirebaseDb();
      return createServiceType(db, data, userId);
    },
    [userId],
  );

  const editType = useCallback(
    async (id: string, data: { name?: string; areaId?: string; price?: number; isMakeup?: boolean }): Promise<void> => {
      const db = getFirebaseDb();
      await updateServiceType(db, id, data);
    },
    [],
  );

  const removeType = useCallback(
    async (id: string): Promise<void> => {
      const db = getFirebaseDb();
      await deleteServiceType(db, id);
    },
    [],
  );

  return {
    types,
    isLoading,
    error,
    addType,
    editType,
    removeType,
  };
}
