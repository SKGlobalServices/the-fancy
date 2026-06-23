"use client";

import { useState, useEffect, useCallback } from "react";
import { getFirebaseDb } from "@/shared/lib/firebase";
import {
  listenExpenses,
  createExpense,
  updateExpense,
  softDeleteExpense,
  restoreExpense as restoreExpenseService,
} from "../services/expense-service";
import type { Expense, ExpenseFormData } from "../types";

export interface UseExpensesReturn {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  addExpense: (data: ExpenseFormData) => Promise<string>;
  editExpense: (id: string, data: Partial<ExpenseFormData>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  restoreExpense: (id: string) => Promise<void>;
  showDeleted: boolean;
  setShowDeleted: (v: boolean) => void;
}

export function useExpenses(
  year: number,
  userId: string,
): UseExpensesReturn {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    const db = getFirebaseDb();

    const unsubscribe = listenExpenses(
      db,
      year,
      (data) => {
        setExpenses(data);
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
  }, [year, showDeleted]);

  const addExpense = useCallback(
    async (data: ExpenseFormData): Promise<string> => {
      const db = getFirebaseDb();
      return createExpense(db, data, userId);
    },
    [userId],
  );

  const editExpense = useCallback(
    async (id: string, data: Partial<ExpenseFormData>): Promise<void> => {
      const db = getFirebaseDb();
      await updateExpense(db, id, data);
    },
    [],
  );

  const removeExpense = useCallback(
    async (id: string): Promise<void> => {
      const db = getFirebaseDb();
      await softDeleteExpense(db, id);
    },
    [],
  );

  const restoreExpense = useCallback(
    async (id: string): Promise<void> => {
      const db = getFirebaseDb();
      await restoreExpenseService(db, id);
    },
    [],
  );

  return {
    expenses,
    isLoading,
    error,
    addExpense,
    editExpense,
    removeExpense,
    restoreExpense,
    showDeleted,
    setShowDeleted,
  };
}
