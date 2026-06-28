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
import type { Sale, SaleFormData } from "../types";
import { PAYMENT_FEE_MAP } from "../types";

const COLLECTION = "sales";

function mapDoc<T extends { id: string }>(id: string, data: DocumentData): T {
  return { id, ...data } as T;
}

// ── Read (real-time) ─────────────────────────────────────────

export function listenSales(
  db: Firestore,
  onData: (sales: Sale[]) => void,
  onError: (err: Error) => void,
  showDeleted?: boolean,
): () => void {
  const salesRef = collection(db, COLLECTION);
  const q = query(salesRef, orderBy("date", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const all = snapshot.docs.map((doc) =>
        mapDoc<Sale>(doc.id, doc.data() as DocumentData),
      );
      const sales = showDeleted
        ? all.filter((s) => s.deletedAt != null)
        : all.filter((s) => s.deletedAt == null);
      onData(sales);
    },
    onError,
  );
}

// ── Create (with denormalization + derived fields) ───────────

export async function createSale(
  db: Firestore,
  data: SaleFormData,
  userId: string,
  catalogs: {
    clientName: string;
    employeeName: string;
    areaName: string;
    typeName: string;
    typePrice: number;
    typeIsMakeup: boolean;
  },
): Promise<string> {
  const now = Timestamp.now();
  const salesRef = collection(db, COLLECTION);

  const feePct = PAYMENT_FEE_MAP[data.paymentMethod] ?? 0;

  const docRef = await addDoc(salesRef, {
    date: data.date,
    clientId: data.clientId,
    clientName: catalogs.clientName,
    employeeId: data.employeeId,
    employeeName: catalogs.employeeName,
    serviceAreaId: data.serviceAreaId,
    serviceAreaName: catalogs.areaName,
    serviceTypeId: data.serviceTypeId,
    serviceTypeName: catalogs.typeName,
    amount: catalogs.typePrice,
    paymentMethod: data.paymentMethod,
    paymentFeePct: feePct,
    isCredit: data.isCredit,
    isMakeup: catalogs.typeIsMakeup,
    observations: data.observations ?? "",
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });

  return docRef.id;
}

// ── Update ────────────────────────────────────────────────────

export async function updateSale(
  db: Firestore,
  id: string,
  data: Partial<SaleFormData>,
): Promise<void> {
  const docRef = doc(db, COLLECTION, id);

  const snap = await getDoc(docRef);
  if (!snap.exists) {
    throw new Error("Venta no encontrada");
  }
  const existingData = snap.data();
  if (existingData?.deletedAt != null) {
    throw new Error("No se puede actualizar una venta eliminada");
  }

  const updatePayload: Record<string, unknown> = {
    ...data,
    updatedAt: Timestamp.now(),
  };

  // Recompute payment fee if payment method changed
  if (data.paymentMethod) {
    updatePayload.paymentFeePct = PAYMENT_FEE_MAP[data.paymentMethod] ?? 0;
  }

  await updateDoc(docRef, updatePayload);
}

// ── Soft Delete ───────────────────────────────────────────────

export async function softDeleteSale(
  db: Firestore,
  id: string,
): Promise<void> {
  const docRef = doc(db, COLLECTION, id);

  const snap = await getDoc(docRef);
  if (!snap.exists) {
    throw new Error("Venta no encontrada");
  }
  const existingData = snap.data();
  if (existingData?.deletedAt != null) {
    throw new Error("La venta ya está eliminada");
  }

  const now = Timestamp.now();
  await updateDoc(docRef, {
    deletedAt: now,
    updatedAt: now,
  });
}

// ── Restore ───────────────────────────────────────────────────

export async function restoreSale(
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
