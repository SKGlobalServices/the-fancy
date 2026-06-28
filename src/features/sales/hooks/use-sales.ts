"use client";

import { useState, useEffect, useCallback } from "react";
import { getFirebaseDb } from "@/shared/lib/firebase";
import {
  listenSales,
  createSale,
  updateSale,
  softDeleteSale,
  restoreSale as restoreSaleService,
} from "../services/sale-service";
import type { Sale, SaleFormData } from "../types";

export interface UseSalesReturn {
  sales: Sale[];
  isLoading: boolean;
  error: string | null;
  addSale: (
    data: SaleFormData,
    catalogs: {
      clientName: string;
      employeeName: string;
      areaName: string;
      typeName: string;
      typePrice: number;
      typeIsMakeup: boolean;
    },
  ) => Promise<string>;
  editSale: (id: string, data: Partial<SaleFormData>) => Promise<void>;
  removeSale: (id: string) => Promise<void>;
  restoreSale: (id: string) => Promise<void>;
  showDeleted: boolean;
  setShowDeleted: (v: boolean) => void;
}

export function useSales(
  userId: string,
): UseSalesReturn {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    const db = getFirebaseDb();

    const unsubscribe = listenSales(
      db,
      (data) => {
        setSales(data);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
      showDeleted,
    );

    return unsubscribe;
  }, [showDeleted]);

  const addSale = useCallback(
    async (
      data: SaleFormData,
      catalogs: {
        clientName: string;
        employeeName: string;
        areaName: string;
        typeName: string;
        typePrice: number;
        typeIsMakeup: boolean;
      },
    ): Promise<string> => {
      const db = getFirebaseDb();
      return createSale(db, data, userId, catalogs);
    },
    [userId],
  );

  const editSale = useCallback(
    async (id: string, data: Partial<SaleFormData>): Promise<void> => {
      const db = getFirebaseDb();
      await updateSale(db, id, data);
    },
    [],
  );

  const removeSale = useCallback(
    async (id: string): Promise<void> => {
      const db = getFirebaseDb();
      await softDeleteSale(db, id);
    },
    [],
  );

  const restoreSale = useCallback(
    async (id: string): Promise<void> => {
      const db = getFirebaseDb();
      await restoreSaleService(db, id);
    },
    [],
  );

  return {
    sales,
    isLoading,
    error,
    addSale,
    editSale,
    removeSale,
    restoreSale,
    showDeleted,
    setShowDeleted,
  };
}
