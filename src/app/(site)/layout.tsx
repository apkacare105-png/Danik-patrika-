import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-3 py-5">{children}</main>
      <Footer />
    </>
  );
}
