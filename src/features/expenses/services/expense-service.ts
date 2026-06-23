import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  type Firestore,
  type DocumentData,
} from "firebase/firestore";
import type { Expense, ExpenseFormData } from "../types";

const COLLECTION = "expenses";

function mapDoc<T extends { id: string }>(id: string, data: DocumentData): T {
  return { id, ...data } as T;
}

// ── Read (real-time) ─────────────────────────────────────────

export function listenExpenses(
  db: Firestore,
  _year: number,
  onData: (expenses: Expense[]) => void,
  onError: (err: Error) => void,
  showDeleted?: boolean,
): () => void {
  const expensesRef = collection(db, COLLECTION);

  // Avoid composite indexes: query ALL expenses ordered by fecha desc,
  // then filter deletedAt client-side. Firestore has automatic index on fecha.
  const q = query(expensesRef, orderBy("fecha", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const all = snapshot.docs.map((doc) =>
        mapDoc<Expense>(doc.id, doc.data() as DocumentData),
      );
      // Client-side deleted filter — avoids needing composite indexes
      const expenses = showDeleted
        ? all.filter((e) => e.deletedAt != null)
        : all.filter((e) => e.deletedAt == null);
      onData(expenses);
    },
    onError,
  );
}

// ── Write (mutations) ────────────────────────────────────────

export async function createExpense(
  db: Firestore,
  data: ExpenseFormData,
  userId: string,
): Promise<string> {
  const now = Timestamp.now();
  const expensesRef = collection(db, COLLECTION);

  const docRef = await addDoc(expensesRef, {
    ...data,
    descripcion: data.descripcion ?? "",
    numeroReciboFoto: data.numeroReciboFoto ?? "",
    observaciones: data.observaciones ?? "",
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });

  return docRef.id;
}

export async function updateExpense(
  db: Firestore,
  id: string,
  data: Partial<ExpenseFormData>,
): Promise<void> {
  const docRef = doc(db, COLLECTION, id);

  // Check if expense exists and is not deleted
  const snap = await getDoc(docRef);
  if (!snap.exists) {
    throw new Error("Gasto no encontrado");
  }
  const existingData = snap.data();
  if (existingData?.deletedAt != null) {
    throw new Error("No se puede actualizar un gasto eliminado");
  }

  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function softDeleteExpense(
  db: Firestore,
  id: string,
): Promise<void> {
  const docRef = doc(db, COLLECTION, id);

  // Check if expense exists and is not already deleted
  const snap = await getDoc(docRef);
  if (!snap.exists) {
    throw new Error("Gasto no encontrado");
  }
  const existingData = snap.data();
  if (existingData?.deletedAt != null) {
    throw new Error("El gasto ya está eliminado");
  }

  const now = Timestamp.now();
  await updateDoc(docRef, {
    deletedAt: now,
    updatedAt: now,
  });
}

export async function restoreExpense(
  db: Firestore,
  id: string,
): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  const now = Timestamp.now();

  await updateDoc(docRef, {
    deletedAt: null,
    updatedAt: now,
  });
}
