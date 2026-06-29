import {
  collection,
  doc,
  setDoc,
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
import type { PaymentMethod } from "../types";

const COLLECTION = "paymentMethods";
const SALES_COLLECTION = "sales";

function mapDoc<T extends { id: string }>(id: string, data: DocumentData): T {
  return { id, ...data } as T;
}

// ── Read (real-time) ─────────────────────────────────────────

export function listenPaymentMethods(
  db: Firestore,
  onData: (methods: PaymentMethod[]) => void,
  onError: (err: Error) => void,
): () => void {
  const ref = collection(db, COLLECTION);
  const q = query(ref, orderBy("sortOrder", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const all = snapshot.docs.map((d) =>
        mapDoc<PaymentMethod>(d.id, d.data() as DocumentData),
      );
      onData(all);
    },
    onError,
  );
}

// ── Create (uses key as doc ID) ───────────────────────────────

export async function createPaymentMethod(
  db: Firestore,
  key: string,
  data: { name: string; feePct: number; sortOrder?: number; isActive?: boolean },
): Promise<void> {
  const trimmedKey = key.trim().toLowerCase().replace(/\s+/g, "_");
  if (!trimmedKey) {
    throw new Error("La clave del método de pago es obligatoria");
  }

  const trimmedName = data.name.trim();
  if (!trimmedName) {
    throw new Error("El nombre del método de pago es obligatorio");
  }

  // Check for existing doc with this key
  const docRef = doc(db, COLLECTION, trimmedKey);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    throw new Error(`Ya existe un método de pago con la clave "${trimmedKey}"`);
  }

  // Check for duplicate name
  await checkDuplicateName(db, trimmedName, null);

  const now = Timestamp.now();

  await setDoc(docRef, {
    name: trimmedName,
    feePct: data.feePct,
    sortOrder: data.sortOrder ?? 0,
    isActive: data.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  });
}

// ── Update ───────────────────────────────────────────────────

export async function updatePaymentMethod(
  db: Firestore,
  key: string,
  data: { name: string; feePct: number; sortOrder?: number; isActive?: boolean },
): Promise<void> {
  const trimmedName = data.name.trim();
  if (!trimmedName) {
    throw new Error("El nombre del método de pago es obligatorio");
  }

  await checkDuplicateName(db, trimmedName, key);

  const docRef = doc(db, COLLECTION, key);
  const now = Timestamp.now();

  await updateDoc(docRef, {
    name: trimmedName,
    feePct: data.feePct,
    sortOrder: data.sortOrder ?? 0,
    isActive: data.isActive ?? true,
    updatedAt: now,
  });
}

// ── Soft Delete ──────────────────────────────────────────────

export async function deletePaymentMethod(
  db: Firestore,
  key: string,
): Promise<void> {
  const docRef = doc(db, COLLECTION, key);

  const snap = await getDoc(docRef);
  if (!snap.exists) {
    throw new Error("Método de pago no encontrado");
  }

  // Check if any sale references this payment method
  const salesRef = collection(db, SALES_COLLECTION);
  const salesSnap = await getDocs(salesRef);
  const hasSales = salesSnap.docs.some(
    (d) => d.data().paymentMethod === key && d.data().deletedAt == null,
  );
  if (hasSales) {
    throw new Error(
      "No se puede eliminar: hay ventas que usan este método de pago. Desactiválo en lugar de eliminarlo.",
    );
  }

  const now = Timestamp.now();
  await updateDoc(docRef, {
    isActive: false,
    updatedAt: now,
  });
}

// ── Helpers ──────────────────────────────────────────────────

async function checkDuplicateName(
  db: Firestore,
  name: string,
  excludeKey: string | null,
): Promise<void> {
  const ref = collection(db, COLLECTION);
  const snap = await getDocs(ref);

  const duplicate = snap.docs.find((d) => {
    if (excludeKey && d.id === excludeKey) return false;
    return (d.data().name as string).toLowerCase() === name.toLowerCase();
  });

  if (duplicate) {
    throw new Error("Ya existe un método de pago con ese nombre");
  }
}
