"use client";

import { useState, useEffect, useCallback } from "react";
import { getFirebaseDb } from "@/shared/lib/firebase";
import {
  listenServiceAreas,
  createServiceArea,
  updateServiceArea,
  deleteServiceArea,
} from "../services/service-area-service";
import type { ServiceArea } from "../types";

export interface UseServiceAreasReturn {
  areas: ServiceArea[];
  isLoading: boolean;
  error: string | null;
  addArea: (data: { name: string; sortOrder?: number }) => Promise<string>;
  editArea: (id: string, data: { name: string; sortOrder?: number }) => Promise<void>;
  removeArea: (id: string) => Promise<void>;
}

export function useServiceAreas(
  userId: string,
): UseServiceAreasReturn {
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirebaseDb();

    const unsubscribe = listenServiceAreas(
      db,
      (data) => {
        setAreas(data);
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

  const addArea = useCallback(
    async (data: { name: string; sortOrder?: number }): Promise<string> => {
      const db = getFirebaseDb();
      return createServiceArea(db, data, userId);
    },
    [userId],
  );

  const editArea = useCallback(
    async (id: string, data: { name: string; sortOrder?: number }): Promise<void> => {
      const db = getFirebaseDb();
      await updateServiceArea(db, id, data);
    },
    [],
  );

  const removeArea = useCallback(
    async (id: string): Promise<void> => {
      const db = getFirebaseDb();
      await deleteServiceArea(db, id);
    },
    [],
  );

  return {
    areas,
    isLoading,
    error,
    addArea,
    editArea,
    removeArea,
  };
}
