"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, X, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useCategories } from "../hooks/use-categories";
import { useAuth } from "@/features/auth/hooks/use-auth";

// ── Props ────────────────────────────────────────────────────

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Component ────────────────────────────────────────────────

export function CategoryManager({ open, onOpenChange }: CategoryManagerProps) {
  const { user } = useAuth();
  const { categories, isLoading, error, addCategory, editCategory, removeCategory } =
    useCategories(user?.uid ?? "");

  // Add category state
  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  // Delete state
  const [deletingCategory, setDeletingCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // ── Add handler ─────────────────────────────────────────

  async function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setIsAdding(true);
    setAddError(null);

    try {
      await addCategory(trimmed);
      setNewName("");
      toast.success(`Categoría "${trimmed}" creada`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al crear la categoría";
      setAddError(message);
    } finally {
      setIsAdding(false);
    }
  }

  // ── Rename handler ──────────────────────────────────────

  async function handleRename(id: string) {
    const trimmed = editingName.trim();
    if (!trimmed) return;

    setIsRenaming(true);
    setRenameError(null);

    try {
      await editCategory(id, trimmed);
      setEditingId(null);
      setEditingName("");
      toast.success("Categoría renombrada");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al renombrar";
      setRenameError(message);
    } finally {
      setIsRenaming(false);
    }
  }

  function startRename(id: string, currentName: string) {
    setEditingId(id);
    setEditingName(currentName);
    setRenameError(null);
  }

  function cancelRename() {
    setEditingId(null);
    setEditingName("");
    setRenameError(null);
  }

  // ── Delete handler ──────────────────────────────────────

  async function handleDelete() {
    if (!deletingCategory) return;

    try {
      await removeCategory(deletingCategory.id, deletingCategory.name);
      setDeletingCategory(null);
      toast.success(`Categoría "${deletingCategory.name}" eliminada`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al eliminar";
      toast.error(message);
    }
  }

  // ── Loading state ───────────────────────────────────────

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Administrar categorías</DialogTitle>
          </DialogHeader>
          <div className="rounded-lg bg-destructive/10 p-4 text-center">
            <p className="text-destructive font-medium">
              Error al cargar categorías: {error}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Render ──────────────────────────────────────────────

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Administrar categorías</DialogTitle>
            <DialogDescription>
              Creá, renombrá y eliminá categorías de gastos
            </DialogDescription>
          </DialogHeader>

          {/* Add new category */}
          <div className="space-y-2">
            <Label htmlFor="new-category">Nueva categoría</Label>
            <div className="flex gap-2">
              <Input
                id="new-category"
                placeholder="Nombre de la categoría"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setAddError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
                disabled={isAdding}
              />
              <Button
                onClick={handleAdd}
                disabled={isAdding || !newName.trim()}
                size="icon"
                aria-label="Agregar categoría"
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
            {addError && (
              <p className="text-sm text-destructive">{addError}</p>
            )}
          </div>

          {/* Category list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                No hay categorías creadas
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Creá tu primera categoría para empezar a organizar los gastos
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    {editingId === cat.id ? (
                      <div className="flex-1 space-y-1">
                        <div className="flex gap-2">
                          <Input
                            value={editingName}
                            onChange={(e) => {
                              setEditingName(e.target.value);
                              setRenameError(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename(cat.id);
                              if (e.key === "Escape") cancelRename();
                            }}
                            autoFocus
                            disabled={isRenaming}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRename(cat.id)}
                            disabled={isRenaming || !editingName.trim()}
                            aria-label="Guardar"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelRename}
                            disabled={isRenaming}
                            aria-label="Cancelar"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {renameError && (
                          <p className="text-sm text-destructive">
                            {renameError}
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-medium">{cat.name}</span>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => startRename(cat.id, cat.name)}
                            aria-label="Renombrar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() =>
                              setDeletingCategory({
                                id: cat.id,
                                name: cat.name,
                              })
                            }
                            aria-label="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la categoría &quot;{deletingCategory?.name}&quot;. Solo se
              puede eliminar si no hay gastos que la usen.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
