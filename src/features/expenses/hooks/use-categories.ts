"use client";

import { useState, useEffect, useCallback } from "react";
import { getFirebaseDb } from "@/shared/lib/firebase";
import {
  listenCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/category-service";
import type { Category } from "../types";

export interface UseCategoriesReturn {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  addCategory: (name: string) => Promise<string>;
  editCategory: (id: string, newName: string) => Promise<void>;
  removeCategory: (id: string, name: string) => Promise<void>;
}

export function useCategories(
  userId: string,
): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirebaseDb();

    const unsubscribe = listenCategories(
      db,
      (data) => {
        setCategories(data);
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

  const addCategory = useCallback(
    async (name: string): Promise<string> => {
      const db = getFirebaseDb();
      return createCategory(db, name, userId);
    },
    [userId],
  );

  const editCategory = useCallback(
    async (id: string, newName: string): Promise<void> => {
      const db = getFirebaseDb();
      await updateCategory(db, id, newName);
    },
    [],
  );

  const removeCategory = useCallback(
    async (id: string, name: string): Promise<void> => {
      const db = getFirebaseDb();
      await deleteCategory(db, id, name);
    },
    [],
  );

  return {
    categories,
    isLoading,
    error,
    addCategory,
    editCategory,
    removeCategory,
  };
}
