"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

import { useSales } from "../hooks/use-sales";
import { useClients } from "../hooks/use-clients";
import { useEmployees } from "../hooks/use-employees";
import { useServiceAreas } from "../hooks/use-service-areas";
import { useServiceTypes } from "../hooks/use-service-types";
import { useAuth } from "@/features/auth/hooks/use-auth";
import type { Sale, SalePaymentMethod } from "../types";
import {
  SalePaymentMethods,
  PAYMENT_FEE_MAP,
  saleFormSchema,
} from "../types";
import { formatCurrency } from "@/shared/lib/currency";

// ── Props ────────────────────────────────────────────────────

interface SaleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale?: Sale;
}

type FormErrors = Partial<Record<string, string>>;

// ── Component ────────────────────────────────────────────────

export function SaleForm({ open, onOpenChange, sale }: SaleFormProps) {
  const { user } = useAuth();
  const locale = useLocale();
  const { clients } = useClients(user?.uid ?? "");
  const { employees } = useEmployees(user?.uid ?? "");
  const { areas } = useServiceAreas(user?.uid ?? "");
  const { types } = useServiceTypes(user?.uid ?? "");
  const { addSale, editSale } = useSales(user?.uid ?? "");
  const t = useTranslations("sales");
  const common = useTranslations("common");

  const [date, setDate] = useState<Date>(new Date());
  const [clientId, setClientId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [serviceAreaId, setServiceAreaId] = useState("");
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>("cash");
  const [isCredit, setIsCredit] = useState(false);
  const [observations, setObservations] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = !!sale;

  // ── Derived values from selected service type ────────────

  const selectedType = useMemo(() => {
    if (!serviceTypeId) return null;
    return types.find((t) => t.id === serviceTypeId) ?? null;
  }, [types, serviceTypeId]);

  const amount = selectedType?.price ?? 0;
  const isMakeup = selectedType?.isMakeup ?? false;
  const paymentFeePct = PAYMENT_FEE_MAP[paymentMethod] ?? 0;

  // ── Filtered service types by selected area ─────────────

  const filteredTypes = useMemo(() => {
    if (!serviceAreaId) return [];
    return types.filter((t) => t.areaId === serviceAreaId);
  }, [types, serviceAreaId]);

  // ── Populate form when editing ──────────────────────────

  useEffect(() => {
    if (sale) {
      setDate(sale.date.toDate());
      setClientId(sale.clientId);
      setEmployeeId(sale.employeeId);
      setServiceAreaId(sale.serviceAreaId);
      setServiceTypeId(sale.serviceTypeId);
      setPaymentMethod(sale.paymentMethod);
      setIsCredit(sale.isCredit);
      setObservations(sale.observations ?? "");
    }
  }, [sale]);

  // ── Reset when opening for create ───────────────────────

  useEffect(() => {
    if (open && !sale) {
      setDate(new Date());
      setClientId("");
      setEmployeeId("");
      setServiceAreaId("");
      setServiceTypeId("");
      setPaymentMethod("cash");
      setIsCredit(false);
      setObservations("");
      setErrors({});
      setSubmitError(null);
    }
  }, [open, sale]);

  function validate(): FormErrors {
    const result = saleFormSchema.safeParse({
      date: Timestamp.fromDate(date),
      clientId,
      employeeId,
      serviceAreaId,
      serviceTypeId,
      paymentMethod,
      isCredit,
      observations: observations || undefined,
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
      date: Timestamp.fromDate(date),
      clientId,
      employeeId,
      serviceAreaId,
      serviceTypeId,
      paymentMethod,
      isCredit,
      observations: observations || undefined,
    };

    try {
      if (isEditing && sale) {
        await editSale(sale.id, formData);
        toast.success(t("toast.updated"));
      } else {
        // Resolve catalog names for denormalization
        const client = clients.find((c) => c.id === clientId);
        const employee = employees.find((e) => e.id === employeeId);
        const area = areas.find((a) => a.id === serviceAreaId);
        const type = types.find((t) => t.id === serviceTypeId);

        if (!client || !employee || !area || !type) {
          throw new Error("Error al resolver datos del catálogo");
        }

        await addSale(formData, {
          clientName: client.name,
          employeeName: employee.name,
          areaName: area.name,
          typeName: type.name,
          typePrice: type.price,
          typeIsMakeup: type.isMakeup,
        });
        toast.success(t("toast.created"));
      }
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al guardar la venta";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function getError(field: string): string | undefined {
    return errors[field];
  }

  const dateLocale = locale === "es" ? es : enUS;

  function translatePaymentMethod(method: string): string {
    return t(`paymentMethods.${method}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t("form.titleEdit") : t("form.titleNew")}</DialogTitle>
          <DialogDescription>
            {isEditing ? t("form.descEdit") : t("form.descNew")}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">{t("form.date")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className="w-full pl-3 text-left font-normal"
                    type="button"
                  >
                    {date ? (
                      format(date, "PPP", { locale: dateLocale })
                    ) : (
                      <span className="text-muted-foreground">
                        {t("form.datePlaceholder")}
                      </span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    disabled={(d: Date) =>
                      d > new Date() || d < new Date("2020-01-01")
                    }
                  />
                </PopoverContent>
              </Popover>
              {getError("date") && (
                <p className="text-sm text-destructive">{getError("date")}</p>
              )}
            </div>

            {/* Client */}
            <div className="space-y-2">
              <Label htmlFor="client">{t("form.client")}</Label>
              <Select onValueChange={setClientId} value={clientId}>
                <SelectTrigger id="client" aria-label={t("form.client")}>
                  <SelectValue placeholder={t("form.clientPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      {t("form.clientEmpty")}
                    </SelectItem>
                  ) : (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {getError("clientId") && (
                <p className="text-sm text-destructive">{getError("clientId")}</p>
              )}
            </div>

            {/* Employee */}
            <div className="space-y-2">
              <Label htmlFor="employee">{t("form.employee")}</Label>
              <Select onValueChange={setEmployeeId} value={employeeId}>
                <SelectTrigger id="employee" aria-label={t("form.employee")}>
                  <SelectValue placeholder={t("form.employeePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {employees.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      {t("form.employeeEmpty")}
                    </SelectItem>
                  ) : (
                    employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {getError("employeeId") && (
                <p className="text-sm text-destructive">{getError("employeeId")}</p>
              )}
            </div>

            {/* Service Area */}
            <div className="space-y-2">
              <Label htmlFor="area">{t("form.serviceArea")}</Label>
              <Select onValueChange={(v) => { setServiceAreaId(v); setServiceTypeId(""); }} value={serviceAreaId}>
                <SelectTrigger id="area" aria-label={t("form.serviceArea")}>
                  <SelectValue placeholder={t("form.areaPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {areas.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      {t("form.areaEmpty")}
                    </SelectItem>
                  ) : (
                    areas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {getError("serviceAreaId") && (
                <p className="text-sm text-destructive">{getError("serviceAreaId")}</p>
              )}
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <Label htmlFor="type">{t("form.serviceType")}</Label>
              <Select
                onValueChange={setServiceTypeId}
                value={serviceTypeId}
                disabled={!serviceAreaId}
              >
                <SelectTrigger id="type" aria-label={t("form.serviceType")}>
                  <SelectValue
                    placeholder={
                      !serviceAreaId
                        ? t("form.typeNoArea")
                        : t("form.typePlaceholder")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredTypes.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      {t("form.typeEmpty")}
                    </SelectItem>
                  ) : (
                    filteredTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} — {formatCurrency(type.price, locale)}
                        {type.isMakeup ? ` (${t("makeup")})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {getError("serviceTypeId") && (
                <p className="text-sm text-destructive">{getError("serviceTypeId")}</p>
              )}
            </div>

            {/* Derived values display */}
            {selectedType && (
              <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("form.amount")}</span>
                  <span className="font-medium">{formatCurrency(amount, locale)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("form.paymentFee")}</span>
                  <span className="font-medium">{paymentFeePct}%</span>
                </div>
                {isMakeup && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("form.makeupLabel")}</span>
                    <Badge variant="outline">{t("makeup")}</Badge>
                  </div>
                )}
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">{t("form.paymentMethod")}</Label>
              <Select onValueChange={(v) => setPaymentMethod(v as SalePaymentMethod)} value={paymentMethod}>
                <SelectTrigger id="paymentMethod" aria-label={t("form.paymentMethod")}>
                  <SelectValue placeholder={t("form.paymentMethodPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {SalePaymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {translatePaymentMethod(method)}
                      {PAYMENT_FEE_MAP[method] > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({PAYMENT_FEE_MAP[method]}%)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getError("paymentMethod") && (
                <p className="text-sm text-destructive">{getError("paymentMethod")}</p>
              )}
            </div>

            {/* Is Credit */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="isCredit">{t("form.isCredit")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("form.isCreditHint")}
                </p>
              </div>
              <Switch
                id="isCredit"
                checked={isCredit}
                onCheckedChange={setIsCredit}
              />
            </div>

            {/* Observations */}
            <div className="space-y-2">
              <Label htmlFor="observations">{t("form.observations")}</Label>
              <Input
                id="observations"
                placeholder={t("form.observationsPlaceholder")}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
              {getError("observations") && (
                <p className="text-sm text-destructive">
                  {getError("observations")}
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
                  {common("saving")}
                </>
              ) : (
                isEditing ? t("form.submitEdit") : t("form.submitNew")
              )}
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
