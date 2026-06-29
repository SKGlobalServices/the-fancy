"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getIdToken } from "@/features/auth/services/auth-service";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil } from "lucide-react";
import type { Role } from "@/features/auth/types";
import { EditUserDialog } from "./edit-user-dialog";

interface UserRecord {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  createdAt: string | null;
  createdBy: string | null;
}

interface UserListProps {
  refreshKey?: number;
}

export function UserList({ refreshKey }: UserListProps) {
  const { user } = useAuth();
  const locale = useLocale();
  const t = useTranslations("users");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localRefreshKey, setLocalRefreshKey] = useState(0);

  // Edit dialog state
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const isSuperAdmin = user?.role === "super-admin";

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getIdToken();
      if (!token) {
        setError("No autenticado");
        return;
      }

      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? body.message ?? "Error al obtener usuarios");
      }

      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, refreshKey, localRefreshKey]);

  function handleEditSuccess() {
    setEditingUser(null);
    setLocalRefreshKey((k) => k + 1);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  const roleBadge = (role: Role) => {
    const variants: Record<Role, string> = {
      "super-admin": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      admin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      user: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    };
    return variants[role] ?? variants.user;
  };

  const columnCount = isSuperAdmin ? 5 : 4;

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("list.headers.name")}</TableHead>
              <TableHead>{t("list.headers.email")}</TableHead>
              <TableHead>{t("list.headers.role")}</TableHead>
              <TableHead>{t("list.headers.created")}</TableHead>
              {isSuperAdmin && <TableHead className="w-[60px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="py-8 text-center text-muted-foreground">
                  {t("list.empty")}
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.uid}>
                  <TableCell className="font-medium">{u.displayName}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge className={roleBadge(u.role)} variant="secondary">
                      {t(`roles.${u.role}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.createdAt
                      ? new Intl.DateTimeFormat(locale === "es" ? "es-AR" : "en-US", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(u.createdAt))
                      : "—"}
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingUser(u);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">{t("edit.title")}</span>
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
