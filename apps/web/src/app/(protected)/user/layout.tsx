import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/server/auth';
import { MainNav } from '@/components/navigation/MainNav';
import { UserNav } from '@/components/navigation/UserNav';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Timer } from 'lucide-react';

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  return (
    <div className="app-background min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:h-16 sm:flex-nowrap sm:gap-x-6 sm:py-0">
          <Link
            href="/user/dashboard"
            className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Timer className="h-4 w-4" aria-hidden />
            </span>
            <span className="hidden text-base sm:inline">Focus</span>
          </Link>
          <MainNav className="order-last w-full sm:order-none sm:w-auto" />
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <UserNav />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
