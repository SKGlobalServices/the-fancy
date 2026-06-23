import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  where,
  orderBy,
  query,
  getDocs,
  Timestamp,
  type Firestore,
  type DocumentData,
} from "firebase/firestore";
import type { Category } from "../types";

const CATEGORIES_COLLECTION = "categories";
const EXPENSES_COLLECTION = "expenses";

function mapDoc<T extends { id: string }>(id: string, data: DocumentData): T {
  return { id, ...data } as T;
}

// ── Read (real-time) ─────────────────────────────────────────

export function listenCategories(
  db: Firestore,
  onData: (categories: Category[]) => void,
  onError: (err: Error) => void,
): () => void {
  const categoriesRef = collection(db, CATEGORIES_COLLECTION);
  const q = query(categoriesRef, orderBy("name", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const categories = snapshot.docs.map((doc) =>
        mapDoc<Category>(doc.id, doc.data() as DocumentData),
      );
      onData(categories);
    },
    onError,
  );
}

// ── Create ───────────────────────────────────────────────────

export async function createCategory(
  db: Firestore,
  name: string,
  userId: string,
): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("El nombre de la categoría es obligatorio");
  }

  // Check duplicate (case-insensitive)
  await checkDuplicateName(db, trimmed, null);

  const now = Timestamp.now();
  const categoriesRef = collection(db, CATEGORIES_COLLECTION);

  const docRef = await addDoc(categoriesRef, {
    name: trimmed,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

// ── Update ───────────────────────────────────────────────────

export async function updateCategory(
  db: Firestore,
  id: string,
  newName: string,
): Promise<void> {
  const trimmed = newName.trim();
  if (!trimmed) {
    throw new Error("El nombre de la categoría es obligatorio");
  }

  // Check duplicate, excluding self
  await checkDuplicateName(db, trimmed, id);

  const docRef = doc(db, CATEGORIES_COLLECTION, id);
  const now = Timestamp.now();

  await updateDoc(docRef, {
    name: trimmed,
    updatedAt: now,
  });
}

// ── Delete ───────────────────────────────────────────────────

export async function deleteCategory(
  db: Firestore,
  id: string,
  categoryName: string,
): Promise<void> {
  const docRef = doc(db, CATEGORIES_COLLECTION, id);

  // Check if category exists
  const catSnap = await getDoc(docRef);
  if (!catSnap.exists) {
    throw new Error("Categoría no encontrada");
  }

  // Check if any expense references this category
  const expensesRef = collection(db, EXPENSES_COLLECTION);
  const q = query(expensesRef, where("categoria", "==", categoryName));
  const expenseSnap = await getDocs(q);

  if (!expenseSnap.empty) {
    throw new Error(
      "No se puede eliminar: hay gastos que usan esta categoría",
    );
  }

  await deleteDoc(docRef);
}

// ── Helpers ──────────────────────────────────────────────────

async function checkDuplicateName(
  db: Firestore,
  name: string,
  excludeId: string | null,
): Promise<void> {
  const categoriesRef = collection(db, CATEGORIES_COLLECTION);
  const snap = await getDocs(categoriesRef);

  const duplicate = snap.docs.find((d) => {
    if (excludeId && d.id === excludeId) return false;
    return (d.data().name as string).toLowerCase() === name.toLowerCase();
  });

  if (duplicate) {
    throw new Error("Ya existe una categoría con ese nombre");
  }
}
