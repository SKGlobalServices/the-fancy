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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import type { ServiceType } from "../types";
import { serviceTypeSchema } from "../types";
import { useServiceTypes } from "../hooks/use-service-types";
import { useServiceAreas } from "../hooks/use-service-areas";
import { useAuth } from "@/features/auth/hooks/use-auth";

// ── Props ────────────────────────────────────────────────────

interface ServiceTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: ServiceType;
  onCreated?: (id: string) => void;
}

type FormErrors = Partial<Record<string, string>>;

// ── Component ────────────────────────────────────────────────

export function ServiceTypeFormDialog({
  open,
  onOpenChange,
  type,
  onCreated,
}: ServiceTypeFormDialogProps) {
  const { user } = useAuth();
  const { addType, editType } = useServiceTypes(user?.uid ?? "");
  const { areas } = useServiceAreas(user?.uid ?? "");
  const t = useTranslations("sales");
  const common = useTranslations("common");

  const [name, setName] = useState(type?.name ?? "");
  const [areaId, setAreaId] = useState(type?.areaId ?? "");
  const [price, setPrice] = useState(String(type?.price ?? ""));
  const [isMakeup, setIsMakeup] = useState(type?.isMakeup ?? false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = !!type;

  useEffect(() => {
    if (open && type) {
      setName(type.name);
      setAreaId(type.areaId);
      setPrice(String(type.price));
      setIsMakeup(type.isMakeup);
    }
  }, [open, type]);

  function validate(): FormErrors {
    const result = serviceTypeSchema.safeParse({
      name,
      areaId,
      price: Number(price),
      isMakeup,
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
      if (isEditing && type) {
        await editType(type.id, {
          name,
          areaId,
          price: Number(price),
          isMakeup,
        });
        toast.success(t("toast.typeUpdated"));
        onOpenChange(false);
      } else {
        const id = await addType({
          name,
          areaId,
          price: Number(price),
          isMakeup,
        });
        toast.success(t("toast.typeCreated"));
        onCreated?.(id);
        onOpenChange(false);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("error.typeSave");
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
            {isEditing ? t("serviceType.edit") : t("serviceType.new")}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t("serviceType.editDesc") : t("serviceType.newDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="type-name">{t("serviceType.name")}</Label>
            <Input
              id="type-name"
              placeholder={t("serviceType.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Area */}
          <div className="space-y-2">
            <Label htmlFor="type-area">{t("serviceType.area")}</Label>
            <Select onValueChange={setAreaId} value={areaId}>
              <SelectTrigger id="type-area" aria-label={t("serviceType.area")}>
                <SelectValue placeholder={t("serviceType.areaPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {areas.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.areaId && (
              <p className="text-sm text-destructive">{errors.areaId}</p>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="type-price">{t("serviceType.price")}</Label>
            <Input
              id="type-price"
              type="number"
              step="0.01"
              min="0"
              placeholder={t("serviceType.pricePlaceholder")}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price}</p>
            )}
          </div>

          {/* Is Makeup */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="type-makeup">{t("serviceType.isMakeup")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("serviceType.isMakeupHint")}
              </p>
            </div>
            <Switch
              id="type-makeup"
              checked={isMakeup}
              onCheckedChange={setIsMakeup}
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
