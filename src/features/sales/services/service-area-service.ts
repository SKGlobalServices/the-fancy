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
import type { ServiceArea } from "../types";

const COLLECTION = "serviceAreas";
const SERVICE_TYPES_COLLECTION = "serviceTypes";

function mapDoc<T extends { id: string }>(id: string, data: DocumentData): T {
  return { id, ...data } as T;
}

// ── Read (real-time) ─────────────────────────────────────────

export function listenServiceAreas(
  db: Firestore,
  onData: (areas: ServiceArea[]) => void,
  onError: (err: Error) => void,
): () => void {
  const ref = collection(db, COLLECTION);
  const q = query(ref, orderBy("sortOrder", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const all = snapshot.docs.map((d) =>
        mapDoc<ServiceArea>(d.id, d.data() as DocumentData),
      );
      onData(all.filter((a) => a.deletedAt == null));
    },
    onError,
  );
}

// ── Create ───────────────────────────────────────────────────

export async function createServiceArea(
  db: Firestore,
  data: { name: string; sortOrder?: number },
  userId: string,
): Promise<string> {
  const trimmed = data.name.trim();
  if (!trimmed) {
    throw new Error("El nombre del área es obligatorio");
  }

  await checkDuplicateName(db, trimmed, null);

  const now = Timestamp.now();
  const ref = collection(db, COLLECTION);

  const docRef = await addDoc(ref, {
    name: trimmed,
    sortOrder: data.sortOrder ?? 0,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });

  return docRef.id;
}

// ── Update ───────────────────────────────────────────────────

export async function updateServiceArea(
  db: Firestore,
  id: string,
  data: { name: string; sortOrder?: number },
): Promise<void> {
  const trimmed = data.name.trim();
  if (!trimmed) {
    throw new Error("El nombre del área es obligatorio");
  }

  await checkDuplicateName(db, trimmed, id);

  const docRef = doc(db, COLLECTION, id);
  const now = Timestamp.now();

  await updateDoc(docRef, {
    name: trimmed,
    sortOrder: data.sortOrder ?? 0,
    updatedAt: now,
  });
}

// ── Delete ───────────────────────────────────────────────────

export async function deleteServiceArea(
  db: Firestore,
  id: string,
): Promise<void> {
  const docRef = doc(db, COLLECTION, id);

  const snap = await getDoc(docRef);
  if (!snap.exists) {
    throw new Error("Área no encontrada");
  }

  // Check if any serviceType references this area
  const typesRef = collection(db, SERVICE_TYPES_COLLECTION);
  const typesSnap = await getDocs(typesRef);
  const hasTypes = typesSnap.docs.some(
    (d) => d.data().areaId === id && d.data().deletedAt == null,
  );
  if (hasTypes) {
    throw new Error(
      "No se puede eliminar: hay tipos de servicio que usan esta área",
    );
  }

  // Also check if any sale references this area
  const salesRef = collection(db, "sales");
  const salesSnap = await getDocs(salesRef);
  const hasSales = salesSnap.docs.some(
    (d) => d.data().serviceAreaId === id,
  );
  if (hasSales) {
    throw new Error(
      "No se puede eliminar: hay ventas que usan esta área",
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
    throw new Error("Ya existe un área con ese nombre");
  }
}
