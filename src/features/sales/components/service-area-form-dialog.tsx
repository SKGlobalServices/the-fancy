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

import type { ServiceArea } from "../types";
import { serviceAreaSchema } from "../types";
import { useServiceAreas } from "../hooks/use-service-areas";
import { useAuth } from "@/features/auth/hooks/use-auth";

// ── Props ────────────────────────────────────────────────────

interface ServiceAreaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  area?: ServiceArea;
  onCreated?: (id: string) => void;
}

type FormErrors = Partial<Record<string, string>>;

// ── Component ────────────────────────────────────────────────

export function ServiceAreaFormDialog({
  open,
  onOpenChange,
  area,
  onCreated,
}: ServiceAreaFormDialogProps) {
  const { user } = useAuth();
  const { addArea, editArea } = useServiceAreas(user?.uid ?? "");
  const t = useTranslations("sales");
  const common = useTranslations("common");

  const [name, setName] = useState(area?.name ?? "");
  const [sortOrder, setSortOrder] = useState(String(area?.sortOrder ?? 0));

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = !!area;

  useEffect(() => {
    if (open && area) {
      setName(area.name);
      setSortOrder(String(area.sortOrder));
    }
  }, [open, area]);

  function validate(): FormErrors {
    const result = serviceAreaSchema.safeParse({
      name,
      sortOrder: Number(sortOrder),
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
      if (isEditing && area) {
        await editArea(area.id, { name, sortOrder: Number(sortOrder) });
        toast.success(t("toast.areaUpdated"));
        onOpenChange(false);
      } else {
        const id = await addArea({ name, sortOrder: Number(sortOrder) });
        toast.success(t("toast.areaCreated"));
        onCreated?.(id);
        onOpenChange(false);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("error.areaSave");
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
            {isEditing ? t("area.edit") : t("area.new")}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t("area.editDesc") : t("area.newDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="area-name">{t("area.name")}</Label>
            <Input
              id="area-name"
              placeholder={t("area.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <Label htmlFor="area-sort">{t("area.sortOrder")}</Label>
            <Input
              id="area-sort"
              type="number"
              min="0"
              placeholder={t("area.sortOrderPlaceholder")}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
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
