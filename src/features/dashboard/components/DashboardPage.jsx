import { useAuthStore } from '@/store/useAuthStore';
import { useLogout } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';

function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { mutate: logout, isPending } = useLogout();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back{user?.name ? `, ${user.name}` : ''}!</p>
        </div>
        <Button variant="outline" onClick={() => logout()} disabled={isPending}>
          {isPending ? 'Signing out…' : 'Sign Out'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {['Total Users', 'Revenue', 'Active Sessions'].map((title, i) => (
          <div key={title} className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold">{(i + 1) * 1234}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardPage;
