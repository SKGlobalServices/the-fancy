"use client";

import { useState } from "react";
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

import type { Employee } from "../types";
import { employeeSchema } from "../types";
import { useEmployees } from "../hooks/use-employees";
import { useAuth } from "@/features/auth/hooks/use-auth";

// ── Props ────────────────────────────────────────────────────

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee;
  onCreated?: (id: string) => void;
}

type FormErrors = Partial<Record<string, string>>;

// ── Component ────────────────────────────────────────────────

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  onCreated,
}: EmployeeFormDialogProps) {
  const { user } = useAuth();
  const { addEmployee, editEmployee } = useEmployees(user?.uid ?? "");
  const t = useTranslations("sales");
  const common = useTranslations("common");

  const [name, setName] = useState(employee?.name ?? "");
  const [phone, setPhone] = useState(employee?.phone ?? "");
  const [isActive, setIsActive] = useState(employee?.isActive ?? true);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = !!employee;

  function validate(): FormErrors {
    const result = employeeSchema.safeParse({
      name,
      phone: phone || undefined,
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
      if (isEditing && employee) {
        await editEmployee(employee.id, { name, phone, isActive });
        toast.success(t("toast.employeeUpdated"));
        onOpenChange(false);
      } else {
        const id = await addEmployee({ name, phone, isActive });
        toast.success(t("toast.employeeCreated"));
        onCreated?.(id);
        onOpenChange(false);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("error.employeeSave");
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
            {isEditing ? t("employee.edit") : t("employee.new")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("employee.editDesc")
              : t("employee.newDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="employee-name">{t("employee.name")}</Label>
            <Input
              id="employee-name"
              placeholder={t("employee.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="employee-phone">{t("employee.phone")}</Label>
            <Input
              id="employee-phone"
              placeholder={t("employee.phonePlaceholder")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Is Active */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="employee-active">{t("employee.isActive")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("employee.isActiveHint")}
              </p>
            </div>
            <Switch
              id="employee-active"
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
