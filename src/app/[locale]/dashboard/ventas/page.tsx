"use client";

import { useState, useMemo } from "react";
import { Plus, ShoppingCart, Users, Briefcase, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { useSales } from "@/features/sales/hooks/use-sales";
import { SalesTable } from "@/features/sales/components/sales-table";
import { SaleForm } from "@/features/sales/components/sale-form";
import { ClientManager } from "@/features/sales/components/client-manager";
import { EmployeeManager } from "@/features/sales/components/employee-manager";
import { ServiceManager } from "@/features/sales/components/service-manager";
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

export default function VentasPage() {
  const { user } = useAuth();
  const locale = useLocale();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const { sales } = useSales(user?.uid ?? "");
  const [showForm, setShowForm] = useState(false);
  const [showClients, setShowClients] = useState(false);
  const [showEmployees, setShowEmployees] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const t = useTranslations("sales");
  const monthNames = MONTH_NAMES[locale] ?? MONTH_NAMES.en;

  // Calculate current month totals
  const monthData = useMemo(() => {
    const monthSales = sales.filter((s) => {
      if (!s.date?.toDate) return false;
      const d = s.date.toDate();
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalAmount = monthSales.reduce((sum, s) => sum + s.amount, 0);
    const totalWithFees = monthSales.reduce((sum, s) => {
      const feeAmount = s.amount * (s.paymentFeePct / 100);
      return sum + s.amount - feeAmount;
    }, 0);
    const totalFeeAmount = totalAmount - totalWithFees;

    return {
      totalAmount,
      totalWithFees,
      totalFeeAmount,
      count: monthSales.length,
      creditCount: monthSales.filter((s) => s.isCredit).length,
      makeupCount: monthSales.filter((s) => s.isMakeup).length,
    };
  }, [sales, currentMonth, currentYear]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden md:inline-flex">
              <Wrench className="mr-2 h-4 w-4" />
              {t("manageCatalogs")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowClients(true)}>
              <Users className="mr-2 h-4 w-4" />
              {t("client.title")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowEmployees(true)}>
              <Briefcase className="mr-2 h-4 w-4" />
              {t("employee.title")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowServices(true)}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {t("service.title")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Month summary bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex flex-col items-start justify-center py-4">
            <p className="text-sm text-muted-foreground">
              {monthNames[currentMonth]}
            </p>
            <p className="text-2xl font-bold">{formatCurrency(monthData.totalAmount, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-start justify-center py-4">
            <p className="text-sm text-muted-foreground">{t("summary.fees")}</p>
            <p className="text-xl font-semibold text-destructive">
              -{formatCurrency(monthData.totalFeeAmount, locale)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-start justify-center py-4">
            <p className="text-sm text-muted-foreground">{t("summary.net")}</p>
            <p className="text-xl font-semibold">
              {formatCurrency(monthData.totalWithFees, locale)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-start justify-center py-4">
            <p className="text-sm text-muted-foreground">{t("title")}</p>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xl font-semibold">{monthData.count}</p>
              {monthData.creditCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {monthData.creditCount} {t("credit")}
                </span>
              )}
              {monthData.makeupCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {monthData.makeupCount} {t("makeup")}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <SalesTable />

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
      <SaleForm
        open={showForm}
        onOpenChange={setShowForm}
      />

      {/* Catalog managers */}
      <ClientManager
        open={showClients}
        onOpenChange={setShowClients}
      />
      <EmployeeManager
        open={showEmployees}
        onOpenChange={setShowEmployees}
      />
      <ServiceManager
        open={showServices}
        onOpenChange={setShowServices}
      />

      {/* Mobile catalog buttons */}
      <div className="fixed bottom-24 right-6 flex flex-col gap-2 md:hidden">
        <Button
          onClick={() => setShowServices(true)}
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-background"
          aria-label={t("service.title")}
        >
          <ShoppingCart className="h-5 w-5" />
        </Button>
        <Button
          onClick={() => setShowClients(true)}
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-background"
          aria-label={t("client.title")}
        >
          <Users className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
