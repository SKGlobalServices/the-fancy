"use client";

import { CreateUserForm } from "@/features/admin-users/components/create-user-form";
import { UserList } from "@/features/admin-users/components/user-list";

export default function AdminUsersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los usuarios del sistema
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium">Usuarios existentes</h2>
        <UserList />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Crear usuario</h2>
        <CreateUserForm />
      </section>
    </div>
  );
}
