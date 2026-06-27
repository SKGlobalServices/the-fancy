"use client";

import { useState, useMemo } from "react";
import { Plus, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useExpenses } from "@/features/expenses/hooks/use-expenses";
import { ExpenseTable } from "@/features/expenses/components/expense-table";
import { ExpenseForm } from "@/features/expenses/components/expense-form";
import { CategoryManager } from "@/features/expenses/components/category-manager";
import { formatCurrency } from "@/shared/lib/currency";

const MONTH_NAMES: Record<string, string[]> = {
  en: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
  es: [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ],
};

export default function GastosPage() {
  const { user } = useAuth();
  const locale = useLocale();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const { expenses } = useExpenses(currentYear, user?.uid ?? "");
  const [showForm, setShowForm] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const t = useTranslations("expenses");
  const monthNames = MONTH_NAMES[locale] ?? MONTH_NAMES.en;

  // Calculate current month total
  const monthTotal = useMemo(() => {
    return expenses
      .filter((exp) => {
        if (!exp.fecha?.toDate) return false;
        const d = exp.fecha.toDate();
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, exp) => sum + exp.monto, 0);
  }, [expenses, currentMonth, currentYear]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t.rich("description", {
              manage: () => t("title"),
            }) || "Manage business expenses"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCategories(true)}
          className="hidden md:inline-flex"
        >
          <Settings2 className="mr-2 h-4 w-4" />
          {t("filters.category")}
        </Button>
      </div>

      {/* Month summary bar */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {monthNames[currentMonth]}
            </p>
            <p className="text-2xl font-bold">{formatCurrency(monthTotal, locale)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{t("title")}</p>
            <p className="text-xl font-semibold">{expenses.length}</p>
          </div>
        </CardContent>
      </Card>

      {/* Expense Table */}
      <ExpenseTable />

      {/* FAB for mobile, inline button for desktop */}
      <div className="fixed bottom-6 right-6 md:static md:flex md:justify-end">
        <Button
          onClick={() => setShowForm(true)}
          className="h-14 w-14 rounded-full shadow-lg md:h-10 md:w-auto md:rounded-lg md:px-4"
          aria-label={t("add")}
        >
          <Plus className="h-6 w-6 md:mr-2" />
          <span className="hidden md:inline">{t("add")}</span>
        </Button>
      </div>

      {/* Form dialog */}
      <ExpenseForm
        open={showForm}
        onOpenChange={setShowForm}
      />

      {/* Category manager dialog */}
      <CategoryManager
        open={showCategories}
        onOpenChange={setShowCategories}
      />

      {/* Mobile categories button */}
      <div className="fixed bottom-24 right-6 md:hidden">
        <Button
          onClick={() => setShowCategories(true)}
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-background"
          aria-label={t("filters.category")}
        >
          <Settings2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
