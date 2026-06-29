"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, GripVertical, Ban } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";

import { usePaymentMethods } from "../hooks/use-payment-methods";
import { PaymentMethodFormDialog } from "./payment-method-form-dialog";
import type { PaymentMethod } from "../types";

// ── Props ────────────────────────────────────────────────────

interface PaymentMethodManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Component ────────────────────────────────────────────────

export function PaymentMethodManager({ open, onOpenChange }: PaymentMethodManagerProps) {
  const { methods, isLoading, error, removeMethod } = usePaymentMethods();
  const t = useTranslations("sales");
  const common = useTranslations("common");

  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | undefined>();
  const [deletingMethod, setDeletingMethod] = useState<PaymentMethod | undefined>();

  async function handleDelete() {
    if (!deletingMethod) return;
    try {
      await removeMethod(deletingMethod.id);
      setDeletingMethod(undefined);
      toast.success(t("toast.paymentMethodDeleted"));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("error.paymentMethodDelete");
      toast.error(message);
    }
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("paymentMethod.title")}</DialogTitle>
          </DialogHeader>
          <div className="rounded-lg bg-destructive/10 p-4 text-center">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("paymentMethod.title")}</DialogTitle>
            <DialogDescription>
              {t("paymentMethod.titleDesc")}
            </DialogDescription>
          </DialogHeader>

          <Button
            onClick={() => {
              setEditingMethod(undefined);
              setShowForm(true);
            }}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("paymentMethod.add")}
          </Button>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : methods.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                {t("paymentMethod.emptyNone")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("paymentMethod.emptyAdd")}
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[350px]">
              <div className="space-y-2">
                {methods.map((method) => (
                  <div
                    key={method.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      !method.isActive ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {method.name}
                          </span>
                          {!method.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              <Ban className="mr-1 h-3 w-3" />
                              {common("inactive")}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <code className="rounded bg-muted px-1">{method.id}</code>
                          <span>{method.feePct}% fee</span>
                          <span>#{method.sortOrder}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingMethod(method);
                          setShowForm(true);
                        }}
                        aria-label={common("edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeletingMethod(method)}
                        aria-label={common("delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Form dialog */}
      <PaymentMethodFormDialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingMethod(undefined);
        }}
        method={editingMethod}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingMethod}
        onOpenChange={(open) => {
          if (!open) setDeletingMethod(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("paymentMethod.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("paymentMethod.deleteDesc", { name: deletingMethod?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{common("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {t("paymentMethod.deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
