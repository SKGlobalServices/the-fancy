"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Switch language">
          <Languages className="h-4 w-4" />
          <span className="ml-1 text-sm">{locale === "en" ? "EN" : "ES"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={locale === "en"}
          onClick={() => router.replace(pathname, { locale: "en" })}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={locale === "es"}
          onClick={() => router.replace(pathname, { locale: "es" })}
        >
          Español
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
