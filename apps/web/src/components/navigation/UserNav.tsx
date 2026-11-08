'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@focus/ui';
import { LogOut } from 'lucide-react';

export function UserNav() {
  const { data: session } = useSession();
  const email = session?.user?.email ?? '';

  return (
    <div className="flex items-center gap-2">
      <div className="hidden text-right leading-tight sm:block">
        <p className="text-sm font-medium">{session?.user?.name ?? 'Account'}</p>
        <p className="max-w-[16rem] truncate text-xs text-muted-foreground">{email}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => signOut({ callbackUrl: '/login' })}
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut aria-hidden />
      </Button>
    </div>
  );
}
