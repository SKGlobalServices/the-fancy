"use client";

import { useState, type FormEvent } from "react";
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
    if (!form.email) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Invalid email address";

    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6)
      errs.password = "Password must be at least 6 characters";

    if (!form.displayName) errs.displayName = "Display name is required";

    if (!canCreateRole(user?.role as Role, form.role))
      errs.role = "You don't have permission to assign this role";

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
          "Failed to create user";
        throw new Error(errorMessage);
      }

      setSuccess(data);
      toast.success("User created successfully", {
        description: `${data.displayName} (${data.email}) has been created as ${ROLE_LABELS[data.role as Role]}.`,
      });
      resetForm();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setErrors({ general: message });
      toast.error("Failed to create user", {
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
            Access Denied
          </CardTitle>
          <CardDescription>
            You do not have permission to create users.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create User</h1>
        <p className="mt-1 text-muted-foreground">
          Add a new user to the system. Fields marked with * are required.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>
            Enter the details for the new user account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Success message */}
            {success && (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">User created</span>
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
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
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
                Password *
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
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
                Display Name *
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Jane Doe"
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
                Role *
              </Label>
              <Select
                value={form.role}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, role: value as Role }))
                }
                disabled={isSubmitting || availableRoles.length <= 1}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
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
                  Creating user...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
