"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("categories");
  const common = useTranslations("common");

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
      toast.success(t("toast.created"));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("error.create");
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
      toast.success(t("toast.renamed"));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("error.rename");
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
      toast.success(t("toast.deleted"));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("error.delete");
      toast.error(message);
    }
  }

  // ── Loading state ───────────────────────────────────────

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
          </DialogHeader>
          <div className="rounded-lg bg-destructive/10 p-4 text-center">
            <p className="text-destructive font-medium">
              {t("error.create")}: {error}
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
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>
              {t("description")}
            </DialogDescription>
          </DialogHeader>

          {/* Add new category */}
          <div className="space-y-2">
            <Label htmlFor="new-category">{t("form.newLabel")}</Label>
            <div className="flex gap-2">
              <Input
                id="new-category"
                placeholder={t("form.namePlaceholder")}
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
                aria-label={common("add")}
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
                {t("empty.none")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("empty.createFirst")}
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
                            aria-label={common("save")}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelRename}
                            disabled={isRenaming}
                            aria-label={common("cancel")}
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
                            aria-label={common("edit")}
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
                            aria-label={common("delete")}
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
            <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete.description", { name: deletingCategory?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>{common("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {t("delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
