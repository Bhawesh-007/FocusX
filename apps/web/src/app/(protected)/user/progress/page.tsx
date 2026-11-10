import type { Metadata } from 'next';
import { auth } from '@/server/auth';
import { ProgressClient } from '@/components/progress/ProgressClient';
import { todayInTz } from '@/lib/dates';

export const metadata: Metadata = { title: 'Progress' };

export default async function ProgressPage() {
  const session = await auth();
  const timezone = session?.user?.timezone ?? 'UTC';

  return <ProgressClient timezone={timezone} key={todayInTz(timezone)} />;
}
