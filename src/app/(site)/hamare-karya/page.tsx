import type { Metadata } from 'next';
import { getPortfolio } from '@/lib/data';
import { PortfolioGrid } from '@/components/portfolio-grid';

export const metadata: Metadata = { title: 'हमारे कार्य' };
export const revalidate = 60;

export default async function PortfolioPage() {
  const projects = await getPortfolio();
  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="font-display text-4xl">हमारे कार्य</h1>
        <p className="mx-auto mt-2 max-w-xl text-neutral-600">हमने जिन ब्रांड्स और संस्थाओं के साथ मिलकर डिजिटल समाधान बनाए, उनकी एक झलक।</p>
      </div>
      <PortfolioGrid projects={projects} />
    </div>
  );
}
