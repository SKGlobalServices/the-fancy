export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome to The Fancy Faces administration panel. You deserve a fancy
          life!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Coming soon</p>
          <p className="mt-1 text-2xl font-semibold">Modules</p>
        </div>
      </div>
    </div>
  );
}
