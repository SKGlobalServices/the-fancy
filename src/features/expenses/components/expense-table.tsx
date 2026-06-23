"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";

import { useExpenses } from "../hooks/use-expenses";
import { useCategories } from "../hooks/use-categories";
import { useAuth } from "@/features/auth/hooks/use-auth";
import type { Expense, PaymentMethod } from "../types";
import { PaymentMethods } from "../types";
import { ExpenseForm } from "./expense-form";

// ── Helpers ──────────────────────────────────────────────────

function formatMonto(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatFecha(ts: any): string {
  if (!ts?.toDate) return "";
  return format(ts.toDate(), "dd/MM/yyyy", { locale: es });
}

// ── Column Helper ────────────────────────────────────────────

const columnHelper = createColumnHelper<Expense>();

// ── Component ────────────────────────────────────────────────

export function ExpenseTable() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const {
    expenses,
    isLoading,
    error,
    removeExpense,
    editExpense,
    addExpense,
    restoreExpense,
    showDeleted,
    setShowDeleted,
  } = useExpenses(currentYear, user?.uid ?? "");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // Date range filter state
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Edit/delete state
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<Expense | undefined>();

  // Filter values
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  const { categories } = useCategories(user?.uid ?? "");

  // ── Date filter ──────────────────────────────────────────

  const filteredData = useMemo(() => {
    return expenses.filter((exp) => {
      if (dateFrom || dateTo) {
        const expDate = exp.fecha?.toDate?.();
        if (!expDate) return true;
        if (dateFrom && expDate < dateFrom) return false;
        if (dateTo) {
          const endOfDay = new Date(dateTo);
          endOfDay.setHours(23, 59, 59, 999);
          if (expDate > endOfDay) return false;
        }
      }
      if (categoryFilter !== "all" && exp.categoria !== categoryFilter) {
        return false;
      }
      if (paymentFilter !== "all" && exp.metodoPago !== paymentFilter) {
        return false;
      }
      if (globalFilter) {
        const term = globalFilter.toLowerCase();
        const searchable = [
          exp.descripcion,
          exp.proveedorLugar,
          exp.categoria,
          exp.observaciones,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(term)) return false;
      }
      return true;
    });
  }, [expenses, dateFrom, dateTo, categoryFilter, paymentFilter, globalFilter]);

  // ── Table instance ───────────────────────────────────────

  const columns = useMemo(
    () => [
      columnHelper.accessor("fecha", {
        header: "Fecha",
        cell: (info) => formatFecha(info.getValue()),
        enableSorting: true,
      }),
      columnHelper.accessor("categoria", {
        header: "Categoría",
        cell: (info) => (
          <Badge variant="outline">{info.getValue()}</Badge>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor("descripcion", {
        header: "Descripción",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("proveedorLugar", {
        header: "Proveedor / Lugar",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("metodoPago", {
        header: "Método de pago",
        cell: (info) => info.getValue(),
        enableSorting: false,
      }),
      columnHelper.accessor("monto", {
        header: "Monto",
        cell: (info) => formatMonto(info.getValue()),
        enableSorting: true,
      }),
      columnHelper.accessor("tieneRecibo", {
        header: "Recibo",
        cell: (info) => info.getValue(),
        enableSorting: false,
      }),
      columnHelper.accessor("registradoPor", {
        header: "Registrado por",
        cell: (info) => info.getValue(),
        enableSorting: false,
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {showDeleted ? (
                <DropdownMenuItem
                  onClick={() => {
                    restoreExpense(row.original.id);
                  }}
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  Restaurar
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingExpense(row.original);
                      setShowForm(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeletingExpense(row.original)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ],
    [showDeleted, restoreExpense],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  });

  // ── Loading state ────────────────────────────────────────

  if (error) {
    return (
      <div className="rounded-lg bg-destructive/10 p-8 text-center">
        <p className="text-destructive font-medium">
          Error al cargar gastos: {error}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-[250px]" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: 8 }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────

  const hasFilters =
    globalFilter ||
    dateFrom ||
    dateTo ||
    categoryFilter !== "all" ||
    paymentFilter !== "all";

  function clearFilters() {
    setGlobalFilter("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setCategoryFilter("all");
    setPaymentFilter("all");
  }

  if (filteredData.length === 0) {
    return (
      <div className="space-y-4">
        {renderFilters()}
        <div className="rounded-lg border border-dashed p-12 text-center">
          {expenses.length === 0 ? (
            <>
              <p className="text-lg font-medium text-muted-foreground">
                No hay gastos registrados
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                    Comenzá agregando tu primer gasto
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-muted-foreground">
                No se encontraron gastos con los filtros actuales
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={clearFilters}
              >
                Limpiar filtros
              </Button>
            </>
          )}
        </div>
        <ExpenseForm
          open={showForm}
          onOpenChange={setShowForm}
          expense={editingExpense}
        />
        {deleteDialog()}
      </div>
    );
  }

  // ── Filter controls ──────────────────────────────────────

  function renderFilters() {
    return (
      <div className="space-y-2">
      {/* Show deleted toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={showDeleted ? "default" : "outline"}
          size="sm"
          onClick={() => setShowDeleted(!showDeleted)}
          type="button"
        >
          {showDeleted ? "Mostrando eliminados" : "Mostrar eliminados"}
        </Button>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        {/* Global search */}
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="search" className="sr-only">
            Buscar
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Buscar gastos..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Date from */}
        <div className="w-[180px]">
          <Label className="text-xs text-muted-foreground">Desde</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                type="button"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom
                  ? format(dateFrom, "dd/MM/yyyy")
                  : "Desde"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(d) => setDateFrom(d)}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date to */}
        <div className="w-[180px]">
          <Label className="text-xs text-muted-foreground">Hasta</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                type="button"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "dd/MM/yyyy") : "Hasta"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(d) => setDateTo(d)}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Category filter */}
        <div className="w-[160px]">
          <Label htmlFor="cat-filter" className="sr-only">
            Categoría
          </Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger id="cat-filter" aria-label="Categoría">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment method filter */}
        <div className="w-[160px]">
          <Label htmlFor="pay-filter" className="sr-only">
            Método de pago
          </Label>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger id="pay-filter" aria-label="Método de pago">
              <SelectValue placeholder="Método de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {PaymentMethods.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      </div>
    );
  }

  // ── Delete confirmation ──────────────────────────────────

  function deleteDialog() {
    return (
      <AlertDialog
        open={!!deletingExpense}
        onOpenChange={(open) => {
          if (!open) setDeletingExpense(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción moverá el gasto a la papelera. Podés restaurarlo
              después si es necesario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deletingExpense) {
                  await removeExpense(deletingExpense.id);
                  setDeletingExpense(undefined);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {renderFilters()}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <button
                        className="flex items-center gap-1 select-none"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() && (
                          <>
                            {{
                              asc: <ChevronUp className="h-4 w-4" />,
                              desc: <ChevronDown className="h-4 w-4" />,
                            }[header.column.getIsSorted() as string] ?? (
                              <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </>
                        )}
                      </button>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </span>
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="w-[80px]" aria-label="Filas por página">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Edit form dialog */}
      <ExpenseForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingExpense(undefined);
        }}
        expense={editingExpense}
      />

      {/* Delete confirmation */}
      {deleteDialog()}
    </div>
  );
}
