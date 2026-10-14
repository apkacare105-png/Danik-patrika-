import type { Metadata } from 'next';
import { LoginForm } from '@/components/login-form';
import { hasSupabase } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'लॉगिन' };

export default function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  return (
    <div className="mx-auto max-w-md py-10">
      <LoginForm demo={!hasSupabase()} next={searchParams.next ?? '/dashboard'} forbidden={searchParams.error === 'forbidden'} />
    </div>
  );
}
