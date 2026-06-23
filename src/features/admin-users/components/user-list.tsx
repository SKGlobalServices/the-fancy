"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getIdToken } from "@/features/auth/services/auth-service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { Role } from "@/features/auth/types";

interface UserRecord {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  createdAt: string | null;
  createdBy: string | null;
}

export function UserList() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
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
    }

    fetchUsers();
  }, []);

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

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Creado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                No hay usuarios
              </TableCell>
            </TableRow>
          ) : (
            users.map((u) => (
              <TableRow key={u.uid}>
                <TableCell className="font-medium">{u.displayName}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Badge className={roleBadge(u.role)} variant="secondary">
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {u.createdAt
                    ? new Intl.DateTimeFormat("es-AR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(u.createdAt))
                    : "—"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
