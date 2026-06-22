export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingresá tus credenciales para continuar
          </p>
        </div>
        {/* TODO: Login form with shadcn components once MCP is ready */}
      </div>
    </div>
  );
}
