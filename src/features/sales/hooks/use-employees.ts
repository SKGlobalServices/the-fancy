"use client";

import { useState, useEffect, useCallback } from "react";
import { getFirebaseDb } from "@/shared/lib/firebase";
import {
  listenEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../services/employee-service";
import type { Employee } from "../types";

export interface UseEmployeesReturn {
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
  addEmployee: (data: { name: string; phone?: string; isActive?: boolean }) => Promise<string>;
  editEmployee: (id: string, data: { name: string; phone?: string; isActive?: boolean }) => Promise<void>;
  removeEmployee: (id: string) => Promise<void>;
}

export function useEmployees(
  userId: string,
): UseEmployeesReturn {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirebaseDb();

    const unsubscribe = listenEmployees(
      db,
      (data) => {
        setEmployees(data);
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

  const addEmployee = useCallback(
    async (data: { name: string; phone?: string; isActive?: boolean }): Promise<string> => {
      const db = getFirebaseDb();
      return createEmployee(db, data, userId);
    },
    [userId],
  );

  const editEmployee = useCallback(
    async (id: string, data: { name: string; phone?: string; isActive?: boolean }): Promise<void> => {
      const db = getFirebaseDb();
      await updateEmployee(db, id, data);
    },
    [],
  );

  const removeEmployee = useCallback(
    async (id: string): Promise<void> => {
      const db = getFirebaseDb();
      await deleteEmployee(db, id);
    },
    [],
  );

  return {
    employees,
    isLoading,
    error,
    addEmployee,
    editEmployee,
    removeEmployee,
  };
}
