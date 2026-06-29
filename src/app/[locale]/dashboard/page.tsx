import { getTranslations } from "next-intl/server";

export default async function DashboardHome() {
  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("welcome")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">{t("comingSoon")}</p>
          <p className="mt-1 text-2xl font-semibold">{t("modules")}</p>
        </div>
      </div>
    </div>
  );
}
