import { NextIntlClientProvider } from "next-intl";
import { render, type RenderOptions } from "@testing-library/react";
import enMessages from "@/i18n/locales/en.json";

function renderWithI18n(
  ui: React.ReactElement,
  locale = "en",
  options?: RenderOptions,
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={enMessages}>
      {ui}
    </NextIntlClientProvider>,
    options,
  );
}

export { renderWithI18n };
