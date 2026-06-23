"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useExpenses } from "@/features/expenses/hooks/use-expenses";
import { ExpenseTable } from "@/features/expenses/components/expense-table";
import { ExpenseForm } from "@/features/expenses/components/expense-form";

export default function GastosPage() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const { expenses } = useExpenses(currentYear, user?.uid ?? "");
  const [showForm, setShowForm] = useState(false);

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

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(value);
  }

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gastos</h1>
          <p className="text-sm text-muted-foreground">
            Administrá los gastos del negocio
          </p>
        </div>
      </div>

      {/* Month summary bar */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Total {monthNames[currentMonth]}
            </p>
            <p className="text-2xl font-bold">{formatCurrency(monthTotal)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Gastos registrados</p>
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
          aria-label="Agregar gasto"
        >
          <Plus className="h-6 w-6 md:mr-2" />
          <span className="hidden md:inline">Nuevo gasto</span>
        </Button>
      </div>

      {/* Form dialog */}
      <ExpenseForm
        open={showForm}
        onOpenChange={setShowForm}
      />
    </div>
  );
}
