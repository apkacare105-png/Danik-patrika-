import { getAdminPortfolio } from '@/lib/admin-data';
import { PortfolioManager } from '@/components/admin/portfolio-manager';

export default async function AdminPortfolioPage() {
  return <PortfolioManager initial={await getAdminPortfolio()} />;
}
