"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getIdToken } from "@/features/auth/services/auth-service";
import { canCreateRole } from "@/features/auth/types";
import type { Role } from "@/features/auth/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EditableUser {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
}

interface EditUserDialogProps {
  user: EditableUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormErrors {
  displayName?: string;
  general?: string;
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: EditUserDialogProps) {
  const { user: currentUser } = useAuth();
  const t = useTranslations("users");
  const common = useTranslations("common");
  const [displayName, setDisplayName] = useState(user.displayName);
  const [role, setRole] = useState<Role>(user.role);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine which roles the current user can edit to
  const availableRoles = currentUser
    ? (["super-admin", "admin", "user"] as Role[]).filter((r) =>
        canCreateRole(currentUser.role as Role, r),
      )
    : [];

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!displayName.trim()) errs.displayName = t("validation.displayNameRequired");
    return errs;
  }

  // Reset form state when dialog opens with a new user
  function handleOpenChange(open: boolean) {
    if (!open) {
      setErrors({});
      setIsSubmitting(false);
    }
    onOpenChange(open);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      const idToken = await getIdToken();
      if (!idToken) {
        throw new Error("Not authenticated");
      }

      const body: Record<string, unknown> = {};
      if (displayName.trim() !== user.displayName) {
        body.displayName = displayName.trim();
      }
      if (role !== user.role) {
        body.role = role;
      }

      // If nothing changed, just close
      if (Object.keys(body).length === 0) {
        handleOpenChange(false);
        return;
      }

      const response = await fetch(`/api/admin/users/${user.uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.details?.[0]?.message ??
          data.message ??
          data.error ??
          t("toast.updateError");
        throw new Error(errorMessage);
      }

      toast.success(t("toast.updated"));
      onSuccess();
      handleOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setErrors({ general: message });
      toast.error(t("toast.updateError"), {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("edit.title")}</DialogTitle>
          <DialogDescription>{t("edit.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* General error */}
          {errors.general && (
            <div
              role="alert"
              className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {errors.general}
            </div>
          )}

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("edit.emailLabel")}</Label>
            <p className="text-sm text-muted-foreground border rounded-lg px-3 py-2.5 bg-muted/50">
              {user.email}
            </p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-displayName" className="text-sm font-medium">
              {t("form.displayName")} *
            </Label>
            <Input
              id="edit-displayName"
              type="text"
              placeholder={t("form.displayNamePlaceholder")}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isSubmitting}
              className="h-11"
            />
            {errors.displayName && (
              <p className="text-xs text-destructive">{errors.displayName}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="edit-role" className="text-sm font-medium">
              {t("form.role")} *
            </Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as Role)}
              disabled={isSubmitting || availableRoles.length <= 1}
            >
              <SelectTrigger className="h-11" id="edit-role">
                <SelectValue placeholder={t("form.rolePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`roles.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {common("cancel")}
            </Button>
            <Button
              type="submit"
              className="h-11 min-w-[140px] text-base font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {common("saving")}
                </>
              ) : (
                t("edit.submit")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
