import { LoginForm } from '@/components/auth/LoginForm';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Timer } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="app-background relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/25">
            <Timer className="h-6 w-6" aria-hidden />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Focus</h1>
            <p className="text-sm text-muted-foreground">Sign in to plan your study day.</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
