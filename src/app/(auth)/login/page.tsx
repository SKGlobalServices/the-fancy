import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <LoginForm />
    </div>
  );
}
