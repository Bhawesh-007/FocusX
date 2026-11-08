import type { Metadata } from 'next';
import { auth } from '@/server/auth';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { todayInTz } from '@/lib/dates';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const session = await auth();
  const timezone = session?.user?.timezone ?? 'UTC';

  return (
    <DashboardClient timezone={timezone} key={todayInTz(timezone)} />
  );
}
