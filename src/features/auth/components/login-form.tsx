"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const { login, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    try {
      await login({ email, password });
    } catch {
      // Error is handled by the auth context
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-sm border-border/50 shadow-lg">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-2xl tracking-tight">Iniciar sesión</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Ingresá tus datos para continuar
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              disabled={isSubmitting}
              className="h-11 text-base"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              className="h-11 text-base"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="h-11 w-full text-base font-medium"
            disabled={isSubmitting || !email || !password}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ingresando...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
