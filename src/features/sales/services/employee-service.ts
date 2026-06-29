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
import type { Employee } from "../types";

const EMPLOYEES_COLLECTION = "employees";
const SALES_COLLECTION = "sales";

function mapDoc<T extends { id: string }>(id: string, data: DocumentData): T {
  return { id, ...data } as T;
}

// ── Read (real-time) ─────────────────────────────────────────

export function listenEmployees(
  db: Firestore,
  onData: (employees: Employee[]) => void,
  onError: (err: Error) => void,
): () => void {
  const ref = collection(db, EMPLOYEES_COLLECTION);
  const q = query(ref, orderBy("name", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const all = snapshot.docs.map((d) =>
        mapDoc<Employee>(d.id, d.data() as DocumentData),
      );
      // Only show active and not deleted
      onData(all.filter((e) => e.isActive && e.deletedAt == null));
    },
    onError,
  );
}

// ── Create ───────────────────────────────────────────────────

export async function createEmployee(
  db: Firestore,
  data: { name: string; phone?: string; isActive?: boolean },
  userId: string,
): Promise<string> {
  const trimmed = data.name.trim();
  if (!trimmed) {
    throw new Error("El nombre del empleado es obligatorio");
  }

  await checkDuplicateName(db, trimmed, null);

  const now = Timestamp.now();
  const ref = collection(db, EMPLOYEES_COLLECTION);

  const docRef = await addDoc(ref, {
    name: trimmed,
    phone: data.phone ?? "",
    isActive: data.isActive ?? true,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });

  return docRef.id;
}

// ── Update ───────────────────────────────────────────────────

export async function updateEmployee(
  db: Firestore,
  id: string,
  data: { name: string; phone?: string; isActive?: boolean },
): Promise<void> {
  const trimmed = data.name.trim();
  if (!trimmed) {
    throw new Error("El nombre del empleado es obligatorio");
  }

  await checkDuplicateName(db, trimmed, id);

  const docRef = doc(db, EMPLOYEES_COLLECTION, id);
  const now = Timestamp.now();

  await updateDoc(docRef, {
    name: trimmed,
    phone: data.phone ?? "",
    isActive: data.isActive ?? true,
    updatedAt: now,
  });
}

// ── Delete (soft) ────────────────────────────────────────────

export async function deleteEmployee(
  db: Firestore,
  id: string,
): Promise<void> {
  const docRef = doc(db, EMPLOYEES_COLLECTION, id);

  const snap = await getDoc(docRef);
  if (!snap.exists) {
    throw new Error("Empleado no encontrado");
  }

  // Check if any sale references this employee
  const salesRef = collection(db, SALES_COLLECTION);
  const salesSnap = await getDocs(salesRef);
  const hasSales = salesSnap.docs.some((d) => d.data().employeeId === id);
  if (hasSales) {
    throw new Error(
      "No se puede eliminar: hay ventas que usan este empleado",
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
  const ref = collection(db, EMPLOYEES_COLLECTION);
  const snap = await getDocs(ref);

  const duplicate = snap.docs.find((d) => {
    if (excludeId && d.id === excludeId) return false;
    return (d.data().name as string).toLowerCase() === name.toLowerCase();
  });

  if (duplicate) {
    throw new Error("Ya existe un empleado con ese nombre");
  }
}
