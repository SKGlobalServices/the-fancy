"use client";

import { useState, useEffect, useCallback } from "react";
import { getFirebaseDb } from "@/shared/lib/firebase";
import {
  listenClients,
  createClient,
  updateClient,
  deleteClient,
} from "../services/client-service";
import type { Client } from "../types";

export interface UseClientsReturn {
  clients: Client[];
  isLoading: boolean;
  error: string | null;
  addClient: (data: { name: string; phone?: string; notes?: string }) => Promise<string>;
  editClient: (id: string, data: { name: string; phone?: string; notes?: string }) => Promise<void>;
  removeClient: (id: string) => Promise<void>;
}

export function useClients(
  userId: string,
): UseClientsReturn {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirebaseDb();

    const unsubscribe = listenClients(
      db,
      (data) => {
        setClients(data);
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

  const addClient = useCallback(
    async (data: { name: string; phone?: string; notes?: string }): Promise<string> => {
      const db = getFirebaseDb();
      return createClient(db, data, userId);
    },
    [userId],
  );

  const editClient = useCallback(
    async (id: string, data: { name: string; phone?: string; notes?: string }): Promise<void> => {
      const db = getFirebaseDb();
      await updateClient(db, id, data);
    },
    [],
  );

  const removeClient = useCallback(
    async (id: string): Promise<void> => {
      const db = getFirebaseDb();
      await deleteClient(db, id);
    },
    [],
  );

  return {
    clients,
    isLoading,
    error,
    addClient,
    editClient,
    removeClient,
  };
}
