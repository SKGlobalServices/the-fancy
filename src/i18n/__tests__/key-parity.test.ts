import { describe, it, expect } from "vitest";
import en from "../locales/en.json";
import es from "../locales/es.json";

type NestedRecord = Record<string, string | NestedRecord>;

function getKeys(obj: NestedRecord, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      keys.push(...getKeys(value as NestedRecord, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

describe("Translation key parity", () => {
  it("en.json and es.json have identical key structure", () => {
    const enKeys = getKeys(en as NestedRecord);
    const esKeys = getKeys(es as NestedRecord);

    const missingInEs = enKeys.filter((k) => !esKeys.includes(k));
    const missingInEn = esKeys.filter((k) => !enKeys.includes(k));

    if (missingInEs.length > 0) {
      console.log("Keys missing in es.json:", missingInEs);
    }
    if (missingInEn.length > 0) {
      console.log("Keys missing in en.json:", missingInEn);
    }

    expect(missingInEs).toEqual([]);
    expect(missingInEn).toEqual([]);
  });

  it("has at least 50 translation keys", () => {
    const enKeys = getKeys(en as NestedRecord);
    expect(enKeys.length).toBeGreaterThanOrEqual(50);
  });

  it("es.json values are different from en.json (actual translation)", () => {
    const enKeys = getKeys(en as NestedRecord);
    const esKeys = getKeys(es as NestedRecord);

    // Check a few known keys
    const testKeys = [
      "common.save",
      "common.delete",
      "common.cancel",
      "expenses.add",
    ];

    for (const key of testKeys) {
      const parts = key.split(".");
      const enVal = parts.reduce((obj: any, p) => obj?.[p], en);
      const esVal = parts.reduce((obj: any, p) => obj?.[p], es);
      expect(enVal).not.toEqual(esVal);
    }
  });
});
