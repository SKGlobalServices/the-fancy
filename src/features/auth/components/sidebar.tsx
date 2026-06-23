"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Scissors,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    requiredRole: null as string | null, // all authenticated users
  },
  {
    label: "Gastos",
    href: "/dashboard/gastos",
    icon: Receipt,
    requiredRole: null as string | null,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    requiredRole: "admin" as const,
  },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-background">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Scissors className="h-5 w-5 text-primary" />
        <span className="text-lg font-semibold tracking-tight">The Fancy</span>
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
              {item.label}
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
          Sign out
        </Button>
      </div>
    </aside>
  );
}
