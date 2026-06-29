"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, GripVertical, Sparkles } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useServiceAreas } from "../hooks/use-service-areas";
import { useServiceTypes } from "../hooks/use-service-types";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ServiceAreaFormDialog } from "./service-area-form-dialog";
import { ServiceTypeFormDialog } from "./service-type-form-dialog";
import type { ServiceArea, ServiceType } from "../types";
import { formatCurrency } from "@/shared/lib/currency";
import { useLocale } from "next-intl";

// ── Props ────────────────────────────────────────────────────

interface ServiceManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Component ────────────────────────────────────────────────

export function ServiceManager({ open, onOpenChange }: ServiceManagerProps) {
  const { user } = useAuth();
  const locale = useLocale();
  const { areas, isLoading: areasLoading, error: areasError, removeArea } = useServiceAreas(user?.uid ?? "");
  const { types, isLoading: typesLoading, error: typesError, removeType } = useServiceTypes(user?.uid ?? "");
  const t = useTranslations("sales");
  const common = useTranslations("common");

  const [activeTab, setActiveTab] = useState("areas");

  // Area state
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [editingArea, setEditingArea] = useState<ServiceArea | undefined>();
  const [deletingArea, setDeletingArea] = useState<ServiceArea | undefined>();

  // Type state
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editingType, setEditingType] = useState<ServiceType | undefined>();
  const [deletingType, setDeletingType] = useState<ServiceType | undefined>();

  async function handleDeleteArea() {
    if (!deletingArea) return;
    try {
      await removeArea(deletingArea.id);
      setDeletingArea(undefined);
      toast.success(t("toast.areaDeleted"));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("error.areaDelete");
      toast.error(message);
    }
  }

  async function handleDeleteType() {
    if (!deletingType) return;
    try {
      await removeType(deletingType.id);
      setDeletingType(undefined);
      toast.success(t("toast.typeDeleted"));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("error.typeDelete");
      toast.error(message);
    }
  }

  const error = areasError || typesError;

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("service.title")}</DialogTitle>
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
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{t("service.title")}</DialogTitle>
            <DialogDescription>
              {t("service.titleDesc")}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="areas">{t("area.title")}</TabsTrigger>
              <TabsTrigger value="types">{t("serviceType.title")}</TabsTrigger>
            </TabsList>

            {/* Areas tab */}
            <TabsContent value="areas" className="space-y-3">
              <Button
                onClick={() => {
                  setEditingArea(undefined);
                  setShowAreaForm(true);
                }}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("area.add")}
              </Button>

              {areasLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : areas.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-lg font-medium text-muted-foreground">
                    {t("area.emptyNone")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("area.emptyAdd")}
                  </p>
                </div>
              ) : (
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-2">
                    {areas.map((area) => (
                      <div
                        key={area.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium truncate">{area.name}</span>
                          <Badge variant="outline" className="text-xs">
                            #{area.sortOrder}
                          </Badge>
                        </div>
                        <div className="flex gap-1 ml-2 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingArea(area);
                              setShowAreaForm(true);
                            }}
                            aria-label={common("edit")}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeletingArea(area)}
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
            </TabsContent>

            {/* Types tab */}
            <TabsContent value="types" className="space-y-3">
              <Button
                onClick={() => {
                  setEditingType(undefined);
                  setShowTypeForm(true);
                }}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("serviceType.add")}
              </Button>

              {typesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : types.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-lg font-medium text-muted-foreground">
                    {t("serviceType.emptyNone")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("serviceType.emptyAdd")}
                  </p>
                </div>
              ) : (
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-2">
                    {types.map((type) => {
                      const area = areas.find((a) => a.id === type.areaId);
                      return (
                        <div
                          key={type.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                {type.name}
                              </span>
                              {type.isMakeup && (
                                <Sparkles className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {area && <span>{area.name}</span>}
                              <span>{formatCurrency(type.price, locale)}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2 shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingType(type);
                                setShowTypeForm(true);
                              }}
                              aria-label={common("edit")}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setDeletingType(type)}
                              aria-label={common("delete")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Area form dialog */}
      <ServiceAreaFormDialog
        open={showAreaForm}
        onOpenChange={(open) => {
          setShowAreaForm(open);
          if (!open) setEditingArea(undefined);
        }}
        area={editingArea}
      />

      {/* Type form dialog */}
      <ServiceTypeFormDialog
        open={showTypeForm}
        onOpenChange={(open) => {
          setShowTypeForm(open);
          if (!open) setEditingType(undefined);
        }}
        type={editingType}
      />

      {/* Delete area confirmation */}
      <AlertDialog
        open={!!deletingArea}
        onOpenChange={(open) => {
          if (!open) setDeletingArea(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("area.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("area.deleteDesc", { name: deletingArea?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{common("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteArea}
            >
              {t("area.deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete type confirmation */}
      <AlertDialog
        open={!!deletingType}
        onOpenChange={(open) => {
          if (!open) setDeletingType(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("serviceType.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("serviceType.deleteDesc", { name: deletingType?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{common("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteType}
            >
              {t("serviceType.deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
