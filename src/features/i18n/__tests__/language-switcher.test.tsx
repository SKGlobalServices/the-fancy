import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockReplace = vi.fn();

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/dashboard",
}));

import { LanguageSwitcher } from "../components/language-switcher";
import { renderWithI18n } from "@/test-utils/render-with-i18n";

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders current locale button", () => {
    renderWithI18n(<LanguageSwitcher />, "en");
    expect(screen.getByText("EN")).toBeDefined();
  });

  it("shows EN when locale is en", () => {
    renderWithI18n(<LanguageSwitcher />, "en");
    const trigger = screen.getByRole("button", { name: /switch language/i });
    expect(trigger).toBeDefined();
    expect(screen.getByText("EN")).toBeDefined();
  });

  it("shows ES when locale is es", () => {
    renderWithI18n(<LanguageSwitcher />, "es");
    expect(screen.getByText("ES")).toBeDefined();
  });

  it("opens dropdown with both options on click", async () => {
    renderWithI18n(<LanguageSwitcher />, "en");

    const trigger = screen.getByRole("button", { name: /switch language/i });
    await userEvent.click(trigger);

    expect(screen.getByText("English")).toBeDefined();
    expect(screen.getByText("Español")).toBeDefined();
  });

  it("calls router.replace when clicking Spanish option", async () => {
    renderWithI18n(<LanguageSwitcher />, "en");

    const trigger = screen.getByRole("button", { name: /switch language/i });
    await userEvent.click(trigger);

    const esOption = screen.getByText("Español");
    await userEvent.click(esOption);

    expect(mockReplace).toHaveBeenCalledWith("/dashboard", { locale: "es" });
  });

  it("calls router.replace when clicking English option from Spanish", async () => {
    renderWithI18n(<LanguageSwitcher />, "es");

    const trigger = screen.getByRole("button", { name: /switch language/i });
    await userEvent.click(trigger);

    const enOption = screen.getByText("English");
    await userEvent.click(enOption);

    expect(mockReplace).toHaveBeenCalledWith("/dashboard", { locale: "en" });
  });
});
