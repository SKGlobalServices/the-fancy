"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Phone, CheckCircle, XCircle } from "lucide-react";
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

import { useEmployees } from "../hooks/use-employees";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { EmployeeFormDialog } from "./employee-form-dialog";
import type { Employee } from "../types";

// ── Props ────────────────────────────────────────────────────

interface EmployeeManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Component ────────────────────────────────────────────────

export function EmployeeManager({ open, onOpenChange }: EmployeeManagerProps) {
  const { user } = useAuth();
  const { employees, isLoading, error, removeEmployee } = useEmployees(user?.uid ?? "");
  const t = useTranslations("sales");
  const common = useTranslations("common");

  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>();
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | undefined>();

  async function handleDelete() {
    if (!deletingEmployee) return;
    try {
      await removeEmployee(deletingEmployee.id);
      setDeletingEmployee(undefined);
      toast.success(t("toast.employeeDeleted"));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("error.employeeDelete");
      toast.error(message);
    }
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("employee.title")}</DialogTitle>
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
            <DialogTitle>{t("employee.title")}</DialogTitle>
            <DialogDescription>
              {t("employee.titleDesc")}
            </DialogDescription>
          </DialogHeader>

          {/* Add button */}
          <Button
            onClick={() => {
              setEditingEmployee(undefined);
              setShowForm(true);
            }}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("employee.add")}
          </Button>

          {/* Employee list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : employees.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                {t("employee.emptyNone")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("employee.emptyAdd")}
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{emp.name}</p>
                        {emp.isActive ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                      </div>
                      {emp.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {emp.phone}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingEmployee(emp);
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
                        onClick={() => setDeletingEmployee(emp)}
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

      {/* Employee form dialog */}
      <EmployeeFormDialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingEmployee(undefined);
        }}
        employee={editingEmployee}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingEmployee}
        onOpenChange={(open) => {
          if (!open) setDeletingEmployee(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("employee.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("employee.deleteDesc", { name: deletingEmployee?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{common("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {t("employee.deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
