"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { CalendarIcon, Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useExpenses } from "../hooks/use-expenses";
import { useCategories } from "../hooks/use-categories";
import { useAuth } from "@/features/auth/hooks/use-auth";
import type { Expense, PaymentMethod, RegisteredBy, SiNo } from "../types";
import {
  PaymentMethods,
  RegisteredByValues,
  SiNoValues,
  expenseSchema,
} from "../types";

// ── Mini dialog for quick category creation ───────────────────

function QuickCategoryDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (name: string) => void;
}) {
  const { user } = useAuth();
  const { addCategory } = useCategories(user?.uid ?? "");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      await addCategory(trimmed);
      onCreated(trimmed);
      setName("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle>Nueva categoría</DialogTitle>
          <DialogDescription>
            Creá una categoría para organizar los gastos
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="quick-cat-name">Nombre</Label>
            <Input
              id="quick-cat-name"
              placeholder="Ej. Lavandería"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
              autoFocus
              disabled={loading}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear categoría"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Props ────────────────────────────────────────────────────

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense;
}

type FormErrors = Partial<Record<string, string>>;

// ── Component ────────────────────────────────────────────────

export function ExpenseForm({ open, onOpenChange, expense }: ExpenseFormProps) {
  const { user } = useAuth();
  const { categories } = useCategories(user?.uid ?? "");
  const { addExpense, editExpense } = useExpenses(
    new Date().getFullYear(),
    user?.uid ?? "",
  );

  const [fecha, setFecha] = useState<Date>(new Date());
  const [categoria, setCategoria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [proveedorLugar, setProveedorLugar] = useState("");
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>("Efectivo");
  const [monto, setMonto] = useState("");
  const [tieneRecibo, setTieneRecibo] = useState<SiNo>("No");
  const [numeroReciboFoto, setNumeroReciboFoto] = useState("");
  const [registradoPor, setRegistradoPor] = useState<RegisteredBy>("Otro");
  const [observaciones, setObservaciones] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showQuickCategory, setShowQuickCategory] = useState(false);

  const isEditing = !!expense;

  // Populate form when editing
  useEffect(() => {
    if (expense) {
      setFecha(expense.fecha.toDate());
      setCategoria(expense.categoria);
      setDescripcion(expense.descripcion ?? "");
      setProveedorLugar(expense.proveedorLugar);
      setMetodoPago(expense.metodoPago);
      setMonto(String(expense.monto));
      setTieneRecibo(expense.tieneRecibo);
      setNumeroReciboFoto(expense.numeroReciboFoto ?? "");
      setRegistradoPor(expense.registradoPor);
      setObservaciones(expense.observaciones ?? "");
    }
  }, [expense]);

  function validate(): FormErrors {
    const result = expenseSchema.safeParse({
      fecha: Timestamp.fromDate(fecha),
      categoria,
      descripcion: descripcion || undefined,
      proveedorLugar,
      metodoPago,
      monto: Number(monto),
      tieneRecibo,
      numeroReciboFoto: numeroReciboFoto || undefined,
      registradoPor,
      observaciones: observaciones || undefined,
    });

    if (result.success) return {};

    const fieldErrors: FormErrors = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) {
        fieldErrors[path] = issue.message;
      }
    }
    return fieldErrors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const formData = {
      fecha: Timestamp.fromDate(fecha),
      categoria,
      descripcion: descripcion || undefined,
      proveedorLugar,
      metodoPago,
      monto: Number(monto),
      tieneRecibo,
      numeroReciboFoto: numeroReciboFoto || undefined,
      registradoPor,
      observaciones: observaciones || undefined,
    };

    try {
      if (isEditing && expense) {
        await editExpense(expense.id, formData);
        toast.success("Gasto actualizado");
      } else {
        await addExpense(formData);
        toast.success("Gasto creado");
      }
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al guardar el gasto";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function getError(field: string): string | undefined {
    return errors[field];
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar gasto" : "Nuevo gasto"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualizá los datos del gasto"
              : "Completá los datos del nuevo gasto"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="fecha"
                    variant="outline"
                    className="w-full pl-3 text-left font-normal"
                    type="button"
                  >
                    {fecha ? (
                      format(fecha, "PPP", { locale: es })
                    ) : (
                      <span className="text-muted-foreground">
                        Seleccioná una fecha
                      </span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fecha}
                    onSelect={(d) => d && setFecha(d)}
                    disabled={(date: Date) =>
                      date > new Date() || date < new Date("2020-01-01")
                    }
                  />
                </PopoverContent>
              </Popover>
              {getError("fecha") && (
                <p className="text-sm text-destructive">{getError("fecha")}</p>
              )}
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="categoria">Categoría</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-primary"
                  onClick={() => setShowQuickCategory(true)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Agregar nueva
                </Button>
              </div>
              <Select
                onValueChange={(v) => {
                  if (v === "__add__") {
                    setShowQuickCategory(true);
                  } else {
                    setCategoria(v);
                  }
                }}
                value={categoria}
                disabled={categories.length === 0}
              >
                <SelectTrigger id="categoria" aria-label="Categoría">
                  <SelectValue
                    placeholder={
                      categories.length === 0
                        ? "Primero crea una categoría"
                        : "Seleccioná una categoría"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      Primero crea una categoría
                    </SelectItem>
                  ) : (
                    <>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                      <div className="border-t px-1 py-1">
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          onClick={() => setShowQuickCategory(true)}
                        >
                          <Plus className="h-4 w-4" />
                          Agregar nueva categoría
                        </button>
                      </div>
                    </>
                  )}
                </SelectContent>
              </Select>
              {getError("categoria") && (
                <p className="text-sm text-destructive">
                  {getError("categoria")}
                </p>
              )}
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                placeholder="Opcional - ej. Shampoo profesional"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
              {getError("descripcion") && (
                <p className="text-sm text-destructive">
                  {getError("descripcion")}
                </p>
              )}
            </div>

            {/* Proveedor / Lugar */}
            <div className="space-y-2">
              <Label htmlFor="proveedorLugar">Proveedor / Lugar</Label>
              <Input
                id="proveedorLugar"
                placeholder="Ej. Distribuidora Belleza S.A."
                value={proveedorLugar}
                onChange={(e) => setProveedorLugar(e.target.value)}
              />
              {getError("proveedorLugar") && (
                <p className="text-sm text-destructive">
                  {getError("proveedorLugar")}
                </p>
              )}
            </div>

            {/* Monto */}
            <div className="space-y-2">
              <Label htmlFor="monto">Monto ($)</Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
              {getError("monto") && (
                <p className="text-sm text-destructive">
                  {getError("monto")}
                </p>
              )}
            </div>

            {/* Método de Pago */}
            <div className="space-y-2">
              <Label htmlFor="metodoPago">Método de pago</Label>
              <Select onValueChange={(v) => setMetodoPago(v as PaymentMethod)} value={metodoPago}>
                <SelectTrigger id="metodoPago" aria-label="Método de pago">
                  <SelectValue placeholder="Seleccioná un método" />
                </SelectTrigger>
                <SelectContent>
                  {PaymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getError("metodoPago") && (
                <p className="text-sm text-destructive">
                  {getError("metodoPago")}
                </p>
              )}
            </div>

            {/* Tiene Recibo */}
            <div className="space-y-2">
              <Label htmlFor="tieneRecibo">Tiene recibo</Label>
              <Select onValueChange={(v) => setTieneRecibo(v as SiNo)} value={tieneRecibo}>
                <SelectTrigger id="tieneRecibo" aria-label="Tiene recibo">
                  <SelectValue placeholder="Seleccioná una opción" />
                </SelectTrigger>
                <SelectContent>
                  {SiNoValues.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getError("tieneRecibo") && (
                <p className="text-sm text-destructive">
                  {getError("tieneRecibo")}
                </p>
              )}
            </div>

            {/* Número de Recibo */}
            <div className="space-y-2">
              <Label htmlFor="numeroReciboFoto">N° de recibo</Label>
              <Input
                id="numeroReciboFoto"
                placeholder="Opcional - FAC-001"
                value={numeroReciboFoto}
                onChange={(e) => setNumeroReciboFoto(e.target.value)}
              />
              {getError("numeroReciboFoto") && (
                <p className="text-sm text-destructive">
                  {getError("numeroReciboFoto")}
                </p>
              )}
            </div>

            {/* Registrado por */}
            <div className="space-y-2">
              <Label htmlFor="registradoPor">Registrado por</Label>
              <Select onValueChange={(v) => setRegistradoPor(v as RegisteredBy)} value={registradoPor}>
                <SelectTrigger id="registradoPor" aria-label="Registrado por">
                  <SelectValue placeholder="¿Quién registra?" />
                </SelectTrigger>
                <SelectContent>
                  {RegisteredByValues.map((person) => (
                    <SelectItem key={person} value={person}>
                      {person}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getError("registradoPor") && (
                <p className="text-sm text-destructive">
                  {getError("registradoPor")}
                </p>
              )}
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Input
                id="observaciones"
                placeholder="Opcional"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
              {getError("observaciones") && (
                <p className="text-sm text-destructive">
                  {getError("observaciones")}
                </p>
              )}
            </div>

            {/* Submit error */}
            {submitError && (
              <div
                role="alert"
                className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {submitError}
              </div>
            )}

            {/* Submit button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar gasto"
              )}
            </Button>
          </form>
        </ScrollArea>

        {/* Quick category creation */}
        <QuickCategoryDialog
          open={showQuickCategory}
          onOpenChange={setShowQuickCategory}
          onCreated={(name) => {
            setCategoria(name);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
