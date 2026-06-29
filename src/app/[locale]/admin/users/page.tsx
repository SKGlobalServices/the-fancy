"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { CreateUserForm } from "@/features/admin-users/components/create-user-form";
import { UserList } from "@/features/admin-users/components/user-list";

export default function AdminUsersPage() {
  const t = useTranslations("users");
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("page.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("page.subtitle")}
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("form.submit")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("form.cardTitle")}</DialogTitle>
              <DialogDescription>{t("form.cardDescription")}</DialogDescription>
            </DialogHeader>
            <CreateUserForm
              onSuccess={() => {
                setCreateOpen(false);
                setRefreshKey((k) => k + 1);
              }}
              onCancel={() => setCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <UserList refreshKey={refreshKey} />
    </div>
  );
}
