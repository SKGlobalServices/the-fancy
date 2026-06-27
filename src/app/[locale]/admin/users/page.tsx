"use client";

import { useTranslations } from "next-intl";
import { CreateUserForm } from "@/features/admin-users/components/create-user-form";
import { UserList } from "@/features/admin-users/components/user-list";

export default function AdminUsersPage() {
  const t = useTranslations("users");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("page.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("page.subtitle")}
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium">{t("list.headers.name")}</h2>
        <UserList />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">{t("form.cardTitle")}</h2>
        <CreateUserForm />
      </section>
    </div>
  );
}
