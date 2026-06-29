"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Phone, StickyNote } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

import { useClients } from "../hooks/use-clients";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ClientFormDialog } from "./client-form-dialog";
import type { Client } from "../types";

// ── Props ────────────────────────────────────────────────────

interface ClientManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Component ────────────────────────────────────────────────

export function ClientManager({ open, onOpenChange }: ClientManagerProps) {
  const { user } = useAuth();
  const { clients, isLoading, error, removeClient } = useClients(user?.uid ?? "");
  const t = useTranslations("sales");
  const common = useTranslations("common");

  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [deletingClient, setDeletingClient] = useState<Client | undefined>();

  async function handleDelete() {
    if (!deletingClient) return;
    try {
      await removeClient(deletingClient.id);
      setDeletingClient(undefined);
      toast.success(t("toast.clientDeleted"));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("error.clientDelete");
      toast.error(message);
    }
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("client.title")}</DialogTitle>
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
            <DialogTitle>{t("client.title")}</DialogTitle>
            <DialogDescription>
              {t("client.titleDesc")}
            </DialogDescription>
          </DialogHeader>

          {/* Add button */}
          <Button
            onClick={() => {
              setEditingClient(undefined);
              setShowForm(true);
            }}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("client.add")}
          </Button>

          {/* Client list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : clients.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                {t("client.emptyNone")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("client.emptyAdd")}
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{client.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </span>
                        )}
                        {client.notes && (
                          <span className="flex items-center gap-1 truncate">
                            <StickyNote className="h-3 w-3" />
                            {client.notes}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingClient(client);
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
                        onClick={() => setDeletingClient(client)}
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

      {/* Client form dialog */}
      <ClientFormDialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingClient(undefined);
        }}
        client={editingClient}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingClient}
        onOpenChange={(open) => {
          if (!open) setDeletingClient(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("client.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("client.deleteDesc", { name: deletingClient?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{common("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {t("client.deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
