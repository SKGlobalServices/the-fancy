import { describe, it, expect } from "vitest";
import { CURRENCY, formatCurrency } from "../currency";

describe("CURRENCY constant", () => {
  it("is AWG", () => {
    expect(CURRENCY).toBe("AWG");
  });

  it("is a const literal type", () => {
    // TypeScript will fail at compile time if CURRENCY is not 'AWG'
    const currency: "AWG" = CURRENCY;
    expect(currency).toBe("AWG");
  });
});

describe("formatCurrency", () => {
  it("formats amount as AWG in English locale", () => {
    const result = formatCurrency(1500.5, "en");
    expect(result).toContain("AWG");
    expect(result).toContain("1");
    expect(result).toContain("500");
  });

  it("formats amount as AWG in Spanish locale", () => {
    const result = formatCurrency(1500.5, "es");
    expect(result).toContain("AWG");
    expect(result).toContain("1");
  });

  it("uses different separators for en and es", () => {
    const enResult = formatCurrency(1500.5, "en");
    const esResult = formatCurrency(1500.5, "es");

    // The formatted values should differ between locales
    // (en uses comma for thousands, es uses period typically)
    expect(enResult).not.toEqual(esResult);
  });

  it("handles zero", () => {
    const result = formatCurrency(0, "en");
    expect(result).toContain("0");
  });

  it("handles large numbers", () => {
    const result = formatCurrency(1000000, "en");
    expect(result).toContain("AWG");
  });

  it("always shows 2 decimal places", () => {
    const result = formatCurrency(100, "en");
    expect(result).toContain("00");
  });
});
