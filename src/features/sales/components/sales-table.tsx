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
import { enUS, es } from "date-fns/locale";
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
  RotateCcw,
  ShoppingCart,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

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

import { useSalesContext } from "../contexts/sales-context";
import { useClients } from "../hooks/use-clients";
import { useEmployees } from "../hooks/use-employees";
import { useServiceAreas } from "../hooks/use-service-areas";
import { useServiceTypes } from "../hooks/use-service-types";
import { usePaymentMethods } from "@/features/payment-methods/hooks/use-payment-methods";
import { SaleForm } from "./sale-form";
import { useAuth } from "@/features/auth/hooks/use-auth";
import type { Sale } from "../types";
import { formatCurrency } from "@/shared/lib/currency";

// ── Helpers ──────────────────────────────────────────────────

function formatDate(ts: any, localeKey: string): string {
  if (!ts?.toDate) return "";
  const dateLocale = localeKey === "es" ? es : enUS;
  return format(ts.toDate(), "dd/MM/yyyy", { locale: dateLocale });
}

// ── Column Helper ────────────────────────────────────────────

const columnHelper = createColumnHelper<Sale>();

// ── Component ────────────────────────────────────────────────

export function SalesTable() {
  const { user } = useAuth();
  const locale = useLocale();
  const {
    sales,
    isLoading,
    error,
    removeSale,
    editSale,
    addSale,
    restoreSale,
    showDeleted,
    setShowDeleted,
  } = useSalesContext();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });

  // Default: no date filter (show all)
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const [editingSale, setEditingSale] = useState<Sale | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [deletingSale, setDeletingSale] = useState<Sale | undefined>();

  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [creditFilter, setCreditFilter] = useState<string>("all");

  const { clients } = useClients(user?.uid ?? "");
  const { employees } = useEmployees(user?.uid ?? "");
  const { areas } = useServiceAreas(user?.uid ?? "");
  const { types } = useServiceTypes(user?.uid ?? "");
  const { activeMethods: paymentMethods } = usePaymentMethods();

  const t = useTranslations("sales");
  const common = useTranslations("common");

  // ── Date filter ──────────────────────────────────────────

  const filteredData = useMemo(() => {
    return sales.filter((sale) => {
      if (dateFrom || dateTo) {
        const saleDate = sale.date?.toDate?.();
        if (!saleDate) return true;
        if (dateFrom && saleDate < dateFrom) return false;
        if (dateTo) {
          const endOfDay = new Date(dateTo);
          endOfDay.setHours(23, 59, 59, 999);
          if (saleDate > endOfDay) return false;
        }
      }
      if (employeeFilter !== "all" && sale.employeeId !== employeeFilter) {
        return false;
      }
      if (clientFilter !== "all" && sale.clientId !== clientFilter) {
        return false;
      }
      if (areaFilter !== "all" && sale.serviceAreaId !== areaFilter) {
        return false;
      }
      if (paymentFilter !== "all" && sale.paymentMethod !== paymentFilter) {
        return false;
      }
      if (creditFilter !== "all") {
        const showCredit = creditFilter === "credit";
        if (sale.isCredit !== showCredit) return false;
      }
      if (globalFilter) {
        const term = globalFilter.toLowerCase();
        const searchable = [
          sale.clientName,
          sale.employeeName,
          sale.serviceAreaName,
          sale.serviceTypeName,
          sale.observations,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(term)) return false;
      }
      return true;
    });
  }, [
    sales,
    dateFrom,
    dateTo,
    employeeFilter,
    clientFilter,
    areaFilter,
    paymentFilter,
    creditFilter,
    globalFilter,
  ]);

  // ── Payment method lookup ─────────────────────────────────

  const paymentMethodNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const pm of paymentMethods) {
      map.set(pm.id, pm.name);
    }
    return map;
  }, [paymentMethods]);

  function getPaymentMethodName(methodId: string): string {
    return paymentMethodNames.get(methodId) ?? methodId;
  }

  // ── Columns ──────────────────────────────────────────────

  const columns = useMemo(
    () => [
      columnHelper.accessor("date", {
        header: t("columns.date"),
        cell: (info) => formatDate(info.getValue(), locale),
        enableSorting: true,
      }),
      columnHelper.accessor("clientName", {
        header: t("columns.client"),
        cell: (info) => info.getValue(),
        enableSorting: true,
      }),
      columnHelper.accessor("employeeName", {
        header: t("columns.employee"),
        cell: (info) => info.getValue(),
        enableSorting: true,
      }),
      columnHelper.accessor("serviceAreaName", {
        header: t("columns.serviceArea"),
        cell: (info) => info.getValue(),
        enableSorting: true,
      }),
      columnHelper.accessor("serviceTypeName", {
        header: t("columns.serviceType"),
        cell: (info) => info.getValue(),
        enableSorting: true,
      }),
      columnHelper.accessor("paymentMethod", {
        header: t("columns.payment"),
        cell: (info) => (
          <div className="flex flex-col">
            <span>{getPaymentMethodName(info.getValue())}</span>
            {info.row.original.paymentFeePct > 0 && (
              <span className="text-xs text-muted-foreground">
                {info.row.original.paymentFeePct}%
              </span>
            )}
          </div>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("amount", {
        header: t("columns.amount"),
        cell: (info) => formatCurrency(info.getValue(), locale),
        enableSorting: true,
      }),
      columnHelper.accessor("isCredit", {
        header: t("columns.credit"),
        cell: (info) => (
          info.getValue() ? (
            <Badge variant="secondary">{t("credit")}</Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          )
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("isMakeup", {
        header: t("columns.makeup"),
        cell: (info) => (
          info.getValue() ? (
            <Badge variant="outline">{t("makeup")}</Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          )
        ),
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
                    restoreSale(row.original.id);
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {common("restore")}
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingSale(row.original);
                      setShowForm(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    {common("edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeletingSale(row.original)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {common("delete")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ],
    [showDeleted, restoreSale, t, common, locale],
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
      pagination: { pageIndex: 0, pageSize: 25 },
    },
  });

  // ── Loading state ────────────────────────────────────────

  if (error) {
    return (
      <div className="rounded-lg bg-destructive/10 p-8 text-center">
        <p className="text-destructive font-medium">
          {t("title")}: {error}
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
                {Array.from({ length: 9 }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
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
    dateFrom !== undefined ||
    dateTo !== undefined ||
    employeeFilter !== "all" ||
    clientFilter !== "all" ||
    areaFilter !== "all" ||
    paymentFilter !== "all" ||
    creditFilter !== "all";

  function clearFilters() {
    setGlobalFilter("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setEmployeeFilter("all");
    setClientFilter("all");
    setAreaFilter("all");
    setPaymentFilter("all");
    setCreditFilter("all");
  }

  if (filteredData.length === 0) {
    return (
      <div className="space-y-4">
        {renderFilters()}
        <div className="rounded-lg border border-dashed p-12 text-center">
          {sales.length === 0 ? (
            <>
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-lg font-medium text-muted-foreground">
                {t("empty.noSales")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("empty.addFirst")}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-muted-foreground">
                {t("empty.noMatch")}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={clearFilters}
              >
                {common("clearFilters")}
              </Button>
            </>
          )}
        </div>
        <SaleForm
          open={showForm}
          onOpenChange={setShowForm}
          sale={editingSale}
        />
        {deleteDialog()}
      </div>
    );
  }

  // ── Filter controls ──────────────────────────────────────

  function renderFilters() {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant={showDeleted ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDeleted(!showDeleted)}
            type="button"
          >
            {showDeleted ? t("showingDeleted") : t("showDeleted")}
          </Button>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {/* Global search */}
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="search" className="sr-only">
              {common("search")}
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                placeholder={t("filters.search")}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Date from */}
          <div className="w-[180px]">
            <Label className="text-xs text-muted-foreground">{t("filters.dateFrom")}</Label>
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
                    : t("filters.dateFrom")}
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
            <Label className="text-xs text-muted-foreground">{t("filters.dateTo")}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "dd/MM/yyyy") : t("filters.dateTo")}
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

          {/* Employee filter */}
          <div className="w-[160px]">
            <Label htmlFor="emp-filter" className="sr-only">
              {t("filters.employee")}
            </Label>
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger id="emp-filter" aria-label={t("filters.employee")}>
                <SelectValue placeholder={t("filters.employee")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{common("all")}</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client filter */}
          <div className="w-[160px]">
            <Label htmlFor="client-filter" className="sr-only">
              {t("filters.client")}
            </Label>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger id="client-filter" aria-label={t("filters.client")}>
                <SelectValue placeholder={t("filters.client")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{common("all")}</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service area filter */}
          <div className="w-[160px]">
            <Label htmlFor="area-filter" className="sr-only">
              {t("filters.serviceArea")}
            </Label>
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger id="area-filter" aria-label={t("filters.serviceArea")}>
                <SelectValue placeholder={t("filters.serviceArea")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{common("all")}</SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment method filter */}
          <div className="w-[160px]">
            <Label htmlFor="pay-filter" className="sr-only">
              {t("filters.paymentMethod")}
            </Label>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger id="pay-filter" aria-label={t("filters.paymentMethod")}>
                <SelectValue placeholder={t("filters.paymentMethod")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{common("all")}</SelectItem>
                {paymentMethods.map((pm) => (
                  <SelectItem key={pm.id} value={pm.id}>
                    {pm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Credit filter */}
          <div className="w-[160px]">
            <Label htmlFor="credit-filter" className="sr-only">
              {t("filters.credit")}
            </Label>
            <Select value={creditFilter} onValueChange={setCreditFilter}>
              <SelectTrigger id="credit-filter" aria-label={t("filters.credit")}>
                <SelectValue placeholder={t("filters.credit")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{common("all")}</SelectItem>
                <SelectItem value="credit">{t("credit")}</SelectItem>
                <SelectItem value="noCredit">{t("noCredit")}</SelectItem>
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
        open={!!deletingSale}
        onOpenChange={(open) => {
          if (!open) setDeletingSale(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{common("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deletingSale) {
                  await removeSale(deletingSale.id);
                  setDeletingSale(undefined);
                }
              }}
            >
              {t("delete.confirm")}
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
            {common("pageOf", {
              page: table.getState().pagination.pageIndex + 1,
              total: table.getPageCount(),
            })}
          </span>
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="w-[80px]" aria-label={common("rowsPerPage")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50].map((size) => (
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
            {common("previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {common("next")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Edit form dialog */}
      <SaleForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingSale(undefined);
        }}
        sale={editingSale}
      />

      {/* Delete confirmation */}
      {deleteDialog()}
    </div>
  );
}
