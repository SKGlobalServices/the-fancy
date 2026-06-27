"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getIdToken } from "@/features/auth/services/auth-service";
import { ROLE_HIERARCHY, canCreateRole } from "@/features/auth/types";
import type { Role, CreateUserResponse } from "@/features/auth/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS: Record<Role, string> = {
  "super-admin": "Super Admin",
  admin: "Admin",
  user: "User",
};

interface FormData {
  email: string;
  password: string;
  displayName: string;
  role: Role;
}

interface FormErrors {
  email?: string;
  password?: string;
  displayName?: string;
  role?: string;
  general?: string;
}

const initialForm: FormData = {
  email: "",
  password: "",
  displayName: "",
  role: "user",
};

export function CreateUserForm() {
  const { user } = useAuth();
  const t = useTranslations("users");
  const common = useTranslations("common");
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<CreateUserResponse | null>(null);

  // Determine which roles the current user can create
  const availableRoles = user
    ? ROLE_HIERARCHY[user.role as Role] ?? []
    : [];

  // Reset the form after success
  function resetForm() {
    setForm(initialForm);
    setErrors({});
    setSuccess(null);
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!form.email) errs.email = t("validation.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = t("validation.emailInvalid");

    if (!form.password) errs.password = t("validation.passwordRequired");
    else if (form.password.length < 6)
      errs.password = t("validation.passwordMin");

    if (!form.displayName) errs.displayName = t("validation.displayNameRequired");

    if (!canCreateRole(user?.role as Role, form.role))
      errs.role = t("validation.rolePermission");

    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccess(null);

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      const idToken = await getIdToken();
      if (!idToken) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.details?.[0]?.message ??
          data.message ??
          data.error ??
          t("toast.createError");
        throw new Error(errorMessage);
      }

      setSuccess(data);
      toast.success(t("toast.created"), {
        description: t("toast.createdDesc", {
          displayName: data.displayName,
          email: data.email,
          role: ROLE_LABELS[data.role as Role],
        }),
      });
      resetForm();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setErrors({ general: message });
      toast.error(t("toast.createError"), {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Guard: user without permission should not see the form
  if (availableRoles.length === 0) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            {t("accessDenied.title")}
          </CardTitle>
          <CardDescription>
            {t("accessDenied.description")}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("form.cardTitle")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("form.cardDescription")}
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>{t("form.cardTitle")}</CardTitle>
          <CardDescription>
            {t("form.cardDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Success message */}
            {success && (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">{t("toast.created")}</span>
                </div>
                <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-500">
                  {success.displayName} ({success.email}) — {ROLE_LABELS[success.role]}
                </p>
              </div>
            )}

            {/* General error */}
            {errors.general && (
              <div
                role="alert"
                className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {errors.general}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t("form.email")} *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t("form.emailPlaceholder")}
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                disabled={isSubmitting}
                className="h-11"
                autoComplete="off"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                {t("form.password")} *
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={t("form.passwordPlaceholder")}
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                disabled={isSubmitting}
                className="h-11"
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium">
                {t("form.displayName")} *
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder={t("form.displayNamePlaceholder")}
                value={form.displayName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, displayName: e.target.value }))
                }
                disabled={isSubmitting}
                className="h-11"
              />
              {errors.displayName && (
                <p className="text-xs text-destructive">
                  {errors.displayName}
                </p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">
                {t("form.role")} *
              </Label>
              <Select
                value={form.role}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, role: value as Role }))
                }
                disabled={isSubmitting || availableRoles.length <= 1}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={t("form.rolePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {t(`roles.${role}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-xs text-destructive">{errors.role}</p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="h-11 w-full text-base font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {common("creating")}
                </>
              ) : (
                t("form.submit")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
