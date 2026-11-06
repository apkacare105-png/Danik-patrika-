import type { Metadata } from 'next';
import { getAccountData } from '@/lib/account-data';
import { AccountView } from '@/components/account/account-view';

export const metadata: Metadata = { title: 'मेरा खाता' };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const { profile, articles, stats, feedback } = await getAccountData();
  return <AccountView profile={profile} articles={articles} stats={stats} feedback={feedback} />;
}
