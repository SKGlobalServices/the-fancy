import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  type Firestore,
  type DocumentData,
} from "firebase/firestore";
import type { Client } from "../types";

const CLIENTS_COLLECTION = "clients";
const SALES_COLLECTION = "sales";

function mapDoc<T extends { id: string }>(id: string, data: DocumentData): T {
  return { id, ...data } as T;
}

// ── Read (real-time) ─────────────────────────────────────────

export function listenClients(
  db: Firestore,
  onData: (clients: Client[]) => void,
  onError: (err: Error) => void,
): () => void {
  const ref = collection(db, CLIENTS_COLLECTION);
  const q = query(ref, orderBy("name", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const all = snapshot.docs.map((d) =>
        mapDoc<Client>(d.id, d.data() as DocumentData),
      );
      onData(all.filter((c) => c.deletedAt == null));
    },
    onError,
  );
}

// ── Create ───────────────────────────────────────────────────

export async function createClient(
  db: Firestore,
  data: { name: string; phone?: string; notes?: string },
  userId: string,
): Promise<string> {
  const trimmed = data.name.trim();
  if (!trimmed) {
    throw new Error("El nombre del cliente es obligatorio");
  }

  // Check duplicate (case-insensitive)
  await checkDuplicateName(db, trimmed, null);

  const now = Timestamp.now();
  const ref = collection(db, CLIENTS_COLLECTION);

  const docRef = await addDoc(ref, {
    name: trimmed,
    phone: data.phone ?? "",
    notes: data.notes ?? "",
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });

  return docRef.id;
}

// ── Update ───────────────────────────────────────────────────

export async function updateClient(
  db: Firestore,
  id: string,
  data: { name: string; phone?: string; notes?: string },
): Promise<void> {
  const trimmed = data.name.trim();
  if (!trimmed) {
    throw new Error("El nombre del cliente es obligatorio");
  }

  await checkDuplicateName(db, trimmed, id);

  const docRef = doc(db, CLIENTS_COLLECTION, id);
  const now = Timestamp.now();

  await updateDoc(docRef, {
    name: trimmed,
    phone: data.phone ?? "",
    notes: data.notes ?? "",
    updatedAt: now,
  });
}

// ── Delete (soft) ────────────────────────────────────────────

export async function deleteClient(
  db: Firestore,
  id: string,
): Promise<void> {
  const docRef = doc(db, CLIENTS_COLLECTION, id);

  const snap = await getDoc(docRef);
  if (!snap.exists) {
    throw new Error("Cliente no encontrado");
  }

  // Check if any sale references this client
  const salesRef = collection(db, SALES_COLLECTION);
  const salesSnap = await getDocs(salesRef);
  const hasSales = salesSnap.docs.some((d) => d.data().clientId === id);
  if (hasSales) {
    throw new Error(
      "No se puede eliminar: hay ventas que usan este cliente",
    );
  }

  const now = Timestamp.now();
  await updateDoc(docRef, {
    deletedAt: now,
    updatedAt: now,
  });
}

// ── Helpers ──────────────────────────────────────────────────

async function checkDuplicateName(
  db: Firestore,
  name: string,
  excludeId: string | null,
): Promise<void> {
  const ref = collection(db, CLIENTS_COLLECTION);
  const snap = await getDocs(ref);

  const duplicate = snap.docs.find((d) => {
    if (excludeId && d.id === excludeId) return false;
    return (d.data().name as string).toLowerCase() === name.toLowerCase();
  });

  if (duplicate) {
    throw new Error("Ya existe un cliente con ese nombre");
  }
}
