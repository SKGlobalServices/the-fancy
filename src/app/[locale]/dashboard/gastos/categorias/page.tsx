"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import { useAuth } from "@/features/auth/hooks/use-auth";
import { useCategories } from "@/features/expenses/hooks/use-categories";

export default function CategoriasPage() {
  const { user } = useAuth();
  const {
    categories,
    isLoading,
    error,
    addCategory,
    editCategory,
    removeCategory,
  } = useCategories(user?.uid ?? "");
  const t = useTranslations("categories");
  const common = useTranslations("common");

  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);

  async function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setIsAdding(true);
    try {
      await addCategory(trimmed);
      setNewName("");
      toast.success(t("toast.created"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error.create"));
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRename(id: string) {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    setIsRenaming(true);
    try {
      await editCategory(id, trimmed);
      setEditingId(null);
      setEditingName("");
      toast.success(t("toast.renamed"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error.rename"));
    } finally {
      setIsRenaming(false);
    }
  }

  async function handleDelete() {
    if (!deletingCategory) return;
    try {
      await removeCategory(deletingCategory.id, deletingCategory.name);
      toast.success(t("toast.deleted"));
      setDeletingCategory(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error.delete"));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("form.newLabel")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder={t("form.namePlaceholder")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              disabled={isAdding}
              className="max-w-sm"
            />
            <Button
              onClick={handleAdd}
              disabled={isAdding || !newName.trim()}
            >
              {isAdding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {common("add")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="rounded-lg bg-destructive/10 p-4 text-center">
              <p className="text-destructive font-medium">
                {t("error.create")}: {error}
              </p>
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
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  {editingId === cat.id ? (
                    <div className="flex flex-1 gap-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(cat.id);
                          if (e.key === "Escape") {
                            setEditingId(null);
                            setEditingName("");
                          }
                        }}
                        autoFocus
                        disabled={isRenaming}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleRename(cat.id)}
                        disabled={isRenaming || !editingName.trim()}
                      >
                        {common("save")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setEditingName("");
                        }}
                        disabled={isRenaming}
                      >
                        {common("cancel")}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium">{cat.name}</span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(cat.id);
                            setEditingName(cat.name);
                          }}
                          aria-label={common("edit")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
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
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
