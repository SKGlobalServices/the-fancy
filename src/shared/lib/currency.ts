export const CURRENCY = "AWG" as const;

const localeMap: Record<string, string> = {
  en: "en-AW",
  es: "es-AW",
};

export function formatCurrency(amount: number, locale: string): string {
  try {
    return new Intl.NumberFormat(localeMap[locale] ?? locale, {
      style: "currency",
      currency: CURRENCY,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback if locale is unsupported
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: CURRENCY,
      minimumFractionDigits: 2,
    }).format(amount);
  }
}
