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
  where,
  Timestamp,
  type Firestore,
  type DocumentData,
} from "firebase/firestore";
import type { ServiceType } from "../types";

const COLLECTION = "serviceTypes";
const SALES_COLLECTION = "sales";

function mapDoc<T extends { id: string }>(id: string, data: DocumentData): T {
  return { id, ...data } as T;
}

// ── Read (real-time) ─────────────────────────────────────────

export function listenServiceTypes(
  db: Firestore,
  onData: (types: ServiceType[]) => void,
  onError: (err: Error) => void,
): () => void {
  const ref = collection(db, COLLECTION);
  const q = query(ref, orderBy("name", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const all = snapshot.docs.map((d) =>
        mapDoc<ServiceType>(d.id, d.data() as DocumentData),
      );
      onData(all.filter((t) => t.deletedAt == null));
    },
    onError,
  );
}

// ── Read by area ─────────────────────────────────────────────

export function listenServiceTypesByArea(
  db: Firestore,
  areaId: string,
  onData: (types: ServiceType[]) => void,
  onError: (err: Error) => void,
): () => void {
  const ref = collection(db, COLLECTION);
  const q = query(ref, where("areaId", "==", areaId), orderBy("name", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const all = snapshot.docs.map((d) =>
        mapDoc<ServiceType>(d.id, d.data() as DocumentData),
      );
      onData(all.filter((t) => t.deletedAt == null));
    },
    onError,
  );
}

// ── Create ───────────────────────────────────────────────────

export async function createServiceType(
  db: Firestore,
  data: { name: string; areaId: string; price: number; isMakeup?: boolean },
  userId: string,
): Promise<string> {
  const trimmed = data.name.trim();
  if (!trimmed) {
    throw new Error("El nombre del tipo de servicio es obligatorio");
  }

  await checkDuplicateName(db, trimmed, null);

  const now = Timestamp.now();
  const ref = collection(db, COLLECTION);

  const docRef = await addDoc(ref, {
    name: trimmed,
    areaId: data.areaId,
    price: data.price,
    isMakeup: data.isMakeup ?? false,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });

  return docRef.id;
}

// ── Update ───────────────────────────────────────────────────

export async function updateServiceType(
  db: Firestore,
  id: string,
  data: { name?: string; areaId?: string; price?: number; isMakeup?: boolean },
): Promise<void> {
  const docRef = doc(db, COLLECTION, id);

  const updatePayload: Record<string, unknown> = { ...data };

  if (data.name) {
    const trimmed = data.name.trim();
    if (!trimmed) {
      throw new Error("El nombre del tipo de servicio es obligatorio");
    }
    await checkDuplicateName(db, trimmed, id);
    updatePayload.name = trimmed;
  }

  updatePayload.updatedAt = Timestamp.now();
  await updateDoc(docRef, updatePayload);
}

// ── Delete (soft) ────────────────────────────────────────────

export async function deleteServiceType(
  db: Firestore,
  id: string,
): Promise<void> {
  const docRef = doc(db, COLLECTION, id);

  const snap = await getDoc(docRef);
  if (!snap.exists) {
    throw new Error("Tipo de servicio no encontrado");
  }

  // Check if any sale references this service type
  const salesRef = collection(db, SALES_COLLECTION);
  const salesSnap = await getDocs(salesRef);
  const hasSales = salesSnap.docs.some(
    (d) => d.data().serviceTypeId === id,
  );
  if (hasSales) {
    throw new Error(
      "No se puede eliminar: hay ventas que usan este tipo de servicio",
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
  const ref = collection(db, COLLECTION);
  const snap = await getDocs(ref);

  const duplicate = snap.docs.find((d) => {
    if (excludeId && d.id === excludeId) return false;
    return (d.data().name as string).toLowerCase() === name.toLowerCase();
  });

  if (duplicate) {
    throw new Error("Ya existe un tipo de servicio con ese nombre");
  }
}
