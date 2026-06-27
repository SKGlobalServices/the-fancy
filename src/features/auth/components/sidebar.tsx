"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "../hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const navItems = [
  {
    labelKey: "sidebar.dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    requiredRole: null as string | null, // all authenticated users
  },
  {
    labelKey: "sidebar.expenses",
    href: "/dashboard/gastos",
    icon: Receipt,
    requiredRole: null as string | null,
  },
  {
    labelKey: "sidebar.users",
    href: "/admin/users",
    icon: Users,
    requiredRole: "admin" as const,
  },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-background">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Image src="/logo_navbar.webp" alt="The Fancy Faces" width={32} height={32} priority unoptimized className="rounded-full" />
        <span className="text-lg font-semibold tracking-tight">The Fancy Faces</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          // Hide items that require admin role for regular users
          if (
            item.requiredRole === "admin" &&
            user?.role !== "admin" &&
            user?.role !== "super-admin"
          ) {
            return null;
          }

          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* User info & logout */}
      <div className="border-t p-4">
        <div className="mb-3 truncate text-sm">
          <p className="font-medium">{user?.displayName}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          {t("common.signOut")}
        </Button>
      </div>
    </aside>
  );
}
