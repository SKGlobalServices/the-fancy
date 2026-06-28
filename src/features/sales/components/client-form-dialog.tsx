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
import { Textarea } from "@/components/ui/textarea";

import type { Client } from "../types";
import { clientSchema } from "../types";
import { useClients } from "../hooks/use-clients";
import { useAuth } from "@/features/auth/hooks/use-auth";

// ── Props ────────────────────────────────────────────────────

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client;
  onCreated?: (id: string) => void;
}

type FormErrors = Partial<Record<string, string>>;

// ── Component ────────────────────────────────────────────────

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  onCreated,
}: ClientFormDialogProps) {
  const { user } = useAuth();
  const { addClient, editClient } = useClients(user?.uid ?? "");
  const t = useTranslations("sales");
  const common = useTranslations("common");

  const [name, setName] = useState(client?.name ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [notes, setNotes] = useState(client?.notes ?? "");

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = !!client;

  function validate(): FormErrors {
    const result = clientSchema.safeParse({
      name,
      phone: phone || undefined,
      notes: notes || undefined,
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
      if (isEditing && client) {
        await editClient(client.id, { name, phone, notes });
        toast.success(t("toast.clientUpdated"));
        onOpenChange(false);
      } else {
        const id = await addClient({ name, phone, notes });
        toast.success(t("toast.clientCreated"));
        onCreated?.(id);
        onOpenChange(false);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("error.clientSave");
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
            {isEditing ? t("client.edit") : t("client.new")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("client.editDesc")
              : t("client.newDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="client-name">{t("client.name")}</Label>
            <Input
              id="client-name"
              placeholder={t("client.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="client-phone">{t("client.phone")}</Label>
            <Input
              id="client-phone"
              placeholder={t("client.phonePlaceholder")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="client-notes">{t("client.notes")}</Label>
            <Textarea
              id="client-notes"
              placeholder={t("client.notesPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
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
