"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import type { PaymentMethod } from "../types";
import { paymentMethodSchema } from "../types";
import { usePaymentMethods } from "../hooks/use-payment-methods";

// ── Props ────────────────────────────────────────────────────

interface PaymentMethodFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method?: PaymentMethod;
}

type FormErrors = Partial<Record<string, string>>;

// ── Component ────────────────────────────────────────────────

export function PaymentMethodFormDialog({
  open,
  onOpenChange,
  method,
}: PaymentMethodFormDialogProps) {
  const { addMethod, editMethod } = usePaymentMethods();
  const t = useTranslations("sales");
  const common = useTranslations("common");

  const [key, setKey] = useState(method?.id ?? "");
  const [name, setName] = useState(method?.name ?? "");
  const [feePct, setFeePct] = useState(String(method?.feePct ?? ""));
  const [sortOrder, setSortOrder] = useState(String(method?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(method?.isActive ?? true);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = !!method;

  useEffect(() => {
    if (open && method) {
      setKey(method.id);
      setName(method.name);
      setFeePct(String(method.feePct));
      setSortOrder(String(method.sortOrder));
      setIsActive(method.isActive);
    }
  }, [open, method]);

  function validate(): FormErrors {
    const result = paymentMethodSchema.safeParse({
      name,
      feePct: Number(feePct),
      sortOrder: Number(sortOrder),
      isActive,
    });

    if (result.success) return {};

    const fieldErrors: FormErrors = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) {
        fieldErrors[path] = issue.message;
      }
    }
    return fieldErrors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (isEditing && method) {
        await editMethod(method.id, {
          name,
          feePct: Number(feePct),
          sortOrder: Number(sortOrder),
          isActive,
        });
        toast.success(t("toast.paymentMethodUpdated"));
        onOpenChange(false);
      } else {
        await addMethod({
          key,
          name,
          feePct: Number(feePct),
          sortOrder: Number(sortOrder),
          isActive,
        });
        toast.success(t("toast.paymentMethodCreated"));
        onOpenChange(false);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("error.paymentMethodSave");
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("paymentMethod.edit") : t("paymentMethod.new")}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t("paymentMethod.editDesc") : t("paymentMethod.newDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Key (only on create) */}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="pm-key">{t("paymentMethod.key")}</Label>
              <Input
                id="pm-key"
                placeholder={t("paymentMethod.keyPlaceholder")}
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("paymentMethod.keyHint")}
              </p>
              {errors.key && (
                <p className="text-sm text-destructive">{errors.key}</p>
              )}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="pm-name">{t("paymentMethod.name")}</Label>
            <Input
              id="pm-name"
              placeholder={t("paymentMethod.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Fee percentage */}
          <div className="space-y-2">
            <Label htmlFor="pm-fee">{t("paymentMethod.feePct")}</Label>
            <Input
              id="pm-fee"
              type="number"
              step="0.1"
              min="0"
              placeholder={t("paymentMethod.feePctPlaceholder")}
              value={feePct}
              onChange={(e) => setFeePct(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t("paymentMethod.feePctHint")}
            </p>
            {errors.feePct && (
              <p className="text-sm text-destructive">{errors.feePct}</p>
            )}
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <Label htmlFor="pm-sort">{t("paymentMethod.sortOrder")}</Label>
            <Input
              id="pm-sort"
              type="number"
              min="0"
              placeholder={t("paymentMethod.sortOrderPlaceholder")}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>

          {/* Is Active */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="pm-active">{t("paymentMethod.isActive")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("paymentMethod.isActiveHint")}
              </p>
            </div>
            <Switch
              id="pm-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          {submitError && (
            <div
              role="alert"
              className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {submitError}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {common("saving")}
              </>
            ) : (
              isEditing ? common("update") : common("create")
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
